import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { ApiError, ask, askJson, MODEL } from './claude.js';
import { GENRES, getGenre, resolveRequest } from './genres.js';
import * as store from './store.js';
import {
  chatSummaryPrompt,
  chatSystemPrompt,
  retellingPrompt,
  textPrompt,
  wordPrompt,
} from './prompts.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = Number(process.env.PORT) || 8787;

/** Обёртка, чтобы не писать try/catch в каждом маршруте. */
const route = (handler) => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);

const plainText = (text) => text.paragraphs.join('\n\n');

async function requireText(id) {
  const text = await store.getText(id);
  if (!text) throw new ApiError(404, 'Текст не найден.');
  return text;
}

// ---------------------------------------------------------------- справочники

app.get('/api/health', (req, res) => {
  res.json({ ok: true, model: MODEL, hasKey: Boolean(process.env.ANTHROPIC_API_KEY) });
});

app.get('/api/genres', (req, res) => {
  res.json(
    GENRES.map(({ id, label, emoji, description, topics }) => ({
      id,
      label,
      emoji,
      description,
      topics,
    })),
  );
});

// ------------------------------------------------------------------ библиотека

app.get('/api/texts', route(async (req, res) => {
  res.json(await store.listTexts());
}));

app.get('/api/texts/:id', route(async (req, res) => {
  res.json(await requireText(req.params.id));
}));

app.delete('/api/texts/:id', route(async (req, res) => {
  const removed = await store.removeText(req.params.id);
  if (!removed) throw new ApiError(404, 'Текст не найден.');
  res.json({ ok: true });
}));

// --------------------------------------------------------- генерация текста

function normalizeGenerated(data) {
  const title = typeof data?.title === 'string' ? data.title.trim() : '';
  const paragraphs = Array.isArray(data?.paragraphs)
    ? data.paragraphs.map((p) => String(p).trim()).filter(Boolean)
    : [];
  const questions = Array.isArray(data?.questions)
    ? data.questions
        .filter(
          (q) =>
            q &&
            typeof q.question === 'string' &&
            Array.isArray(q.options) &&
            q.options.length >= 2 &&
            Number.isInteger(q.correctIndex) &&
            q.correctIndex >= 0 &&
            q.correctIndex < q.options.length,
        )
        .map((q) => ({
          question: q.question.trim(),
          options: q.options.map((option) => String(option).trim()),
          correctIndex: q.correctIndex,
          explanation: typeof q.explanation === 'string' ? q.explanation.trim() : '',
        }))
    : [];

  if (!title || paragraphs.length < 2 || questions.length === 0) {
    throw new ApiError(502, 'Модель вернула текст в неожиданном формате. Попробуйте ещё раз.');
  }
  return { title, paragraphs, questions };
}

app.post('/api/texts', route(async (req, res) => {
  const { genre: genreId, topic } = req.body ?? {};
  if (genreId && genreId !== 'surprise' && !getGenre(genreId)) {
    throw new ApiError(400, 'Неизвестный жанр.');
  }

  const { genre, topic: resolvedTopic, topicWasRandom } = resolveRequest({ genre: genreId, topic });
  const generated = normalizeGenerated(await askJson({ ...textPrompt({ genre, topic: resolvedTopic }), maxTokens: 3000, effort: 'high' }));

  const text = {
    id: randomUUID(),
    ...generated,
    topic: resolvedTopic,
    topicWasRandom,
    genre: { id: genre.id, label: genre.label, emoji: genre.emoji },
    createdAt: new Date().toISOString(),
    status: 'new',
    lastStep: 'read',
    glossary: {},
    quizResult: null,
    retelling: null,
    chat: [],
    chatSummary: null,
  };

  await store.addText(text);
  res.status(201).json(text);
}));

// ------------------------------------------------------------------ прогресс

const STATUS_ORDER = ['new', 'reading', 'quiz_done', 'chat_done'];

/** Статус только растёт: возврат к чтению не сбрасывает пройденный тест. */
function advanceStatus(text, status) {
  if (STATUS_ORDER.indexOf(status) > STATUS_ORDER.indexOf(text.status)) {
    text.status = status;
  }
}

app.patch('/api/texts/:id/progress', route(async (req, res) => {
  const { status, lastStep } = req.body ?? {};
  const text = await store.updateText(req.params.id, (item) => {
    if (status && STATUS_ORDER.includes(status)) advanceStatus(item, status);
    if (lastStep) item.lastStep = lastStep;
  });
  if (!text) throw new ApiError(404, 'Текст не найден.');
  res.json({ status: text.status, lastStep: text.lastStep });
}));

// ------------------------------------------------------- перевод слова

app.post('/api/texts/:id/word', route(async (req, res) => {
  const word = String(req.body?.word ?? '').trim();
  const sentence = String(req.body?.sentence ?? '').trim();
  if (!word) throw new ApiError(400, 'Не передано слово.');

  const text = await requireText(req.params.id);
  const key = `${word.toLowerCase()}::${sentence.slice(0, 60).toLowerCase()}`;
  const cached = text.glossary?.[key];
  if (cached) {
    res.json({ ...cached, cached: true });
    return;
  }

  const data = await askJson({
    ...wordPrompt({ word, sentence, title: text.title, genre: text.genre.label }),
    maxTokens: 400,
    effort: 'low',
  });

  const entry = {
    word: String(data?.word ?? word),
    lemma: String(data?.lemma ?? word),
    translation: String(data?.translation ?? '').trim() || '—',
    pos: String(data?.pos ?? '').trim(),
    note: String(data?.note ?? '').trim(),
  };

  await store.updateText(text.id, (item) => {
    item.glossary ??= {};
    item.glossary[key] = entry;
    advanceStatus(item, 'reading');
  });

  res.json({ ...entry, cached: false });
}));

// ------------------------------------------------------------------- тест

app.post('/api/texts/:id/quiz', route(async (req, res) => {
  const answers = Array.isArray(req.body?.answers) ? req.body.answers : null;
  if (!answers) throw new ApiError(400, 'Не переданы ответы.');

  const text = await requireText(req.params.id);
  const details = text.questions.map((question, index) => ({
    index,
    given: answers[index],
    correctIndex: question.correctIndex,
    isCorrect: answers[index] === question.correctIndex,
    explanation: question.explanation,
  }));

  const result = {
    answers,
    details,
    correct: details.filter((d) => d.isCorrect).length,
    total: text.questions.length,
    at: new Date().toISOString(),
  };

  await store.updateText(text.id, (item) => {
    item.quizResult = result;
    item.lastStep = 'quiz';
    advanceStatus(item, 'quiz_done');
  });

  res.json(result);
}));

// -------------------------------------------------------------- пересказ

app.post('/api/texts/:id/retelling', route(async (req, res) => {
  const retelling = String(req.body?.retelling ?? '').trim();
  if (retelling.length < 20) {
    throw new ApiError(400, 'Пересказ слишком короткий — напишите хотя бы пару предложений.');
  }

  const text = await requireText(req.params.id);
  const feedback = await askJson({
    ...retellingPrompt({ title: text.title, text: plainText(text), retelling }),
    maxTokens: 2000,
    effort: 'medium',
  });

  const record = { text: retelling, feedback, at: new Date().toISOString() };
  await store.updateText(text.id, (item) => {
    item.retelling = record;
    item.lastStep = 'retell';
    advanceStatus(item, 'quiz_done');
  });

  res.json(record);
}));

// ---------------------------------------------------------------- диалог

app.post('/api/texts/:id/chat', route(async (req, res) => {
  const message = String(req.body?.message ?? '').trim();
  const text = await requireText(req.params.id);

  const history = (text.chat ?? []).map(({ role, content }) => ({ role, content }));
  // Пустое сообщение = «начни разговор»: модели нужен первый user-ход.
  const outgoing = message || 'Let\'s talk about the text. Please start.';
  const messages = [...history, { role: 'user', content: outgoing }];

  const reply = await ask({
    system: chatSystemPrompt({
      title: text.title,
      text: plainText(text),
      genre: text.genre.label,
    }),
    messages,
    maxTokens: 700,
    effort: 'low',
  });

  const now = new Date().toISOString();
  const turns = [];
  if (message) turns.push({ role: 'user', content: message, at: now });
  turns.push({ role: 'assistant', content: reply, at: now });

  await store.updateText(text.id, (item) => {
    item.chat ??= [];
    // Стартовую заглушку в историю не пишем — она нужна только API.
    if (!message && item.chat.length === 0) {
      item.chat.push({ role: 'user', content: outgoing, at: now, hidden: true });
    }
    item.chat.push(...turns);
    item.lastStep = 'chat';
    advanceStatus(item, 'quiz_done');
  });

  res.json({ reply, turns });
}));

app.post('/api/texts/:id/chat/summary', route(async (req, res) => {
  const text = await requireText(req.params.id);
  const visible = (text.chat ?? []).filter((turn) => !turn.hidden);
  if (visible.filter((turn) => turn.role === 'user').length < 2) {
    throw new ApiError(400, 'Слишком короткий диалог — напишите хотя бы пару реплик.');
  }

  const transcript = visible
    .map((turn) => `${turn.role === 'user' ? 'LEARNER' : 'TUTOR'}: ${turn.content}`)
    .join('\n\n');

  const summary = await askJson({
    ...chatSummaryPrompt({ title: text.title, transcript }),
    maxTokens: 1500,
    effort: 'medium',
  });

  await store.updateText(text.id, (item) => {
    item.chatSummary = { ...summary, at: new Date().toISOString() };
    advanceStatus(item, 'chat_done');
  });

  res.json(summary);
}));

// ----------------------------------------------------- статика и ошибки

const distDir = path.join(here, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

app.use((error, req, res, next) => {
  const status = error instanceof ApiError ? error.status : 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ error: error.message || 'Внутренняя ошибка сервера.' });
});

app.listen(PORT, () => {
  console.log(`English Reader API → http://localhost:${PORT}  (модель: ${MODEL})`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠  ANTHROPIC_API_KEY не задан — генерация работать не будет. См. .env.example');
  }
});
