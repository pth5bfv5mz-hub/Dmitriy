import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ApiError, ask, askJson, MODEL } from './claude.js';
import { GENRES, getGenre, resolveRequest } from '../shared/genres.js';
import {
  chatSummaryPrompt,
  chatSystemPrompt,
  retellingPrompt,
  textPrompt,
  wordPrompt,
} from '../shared/prompts.js';

/**
 * Сервер без состояния: он только ходит в Anthropic API и отдаёт фронтенд.
 * Библиотека текстов и весь прогресс хранятся в браузере пользователя
 * (localStorage), поэтому перезапуск сервера ничего не теряет — это важно
 * для бесплатных хостингов с временной файловой системой.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = Number(process.env.PORT) || 8787;

const route = (handler) => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);

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

  // Описание картинки необязательно: без него текст просто покажется без иллюстрации.
  const imagePrompt =
    typeof data?.imagePrompt === 'string' ? data.imagePrompt.trim().slice(0, 300) : '';

  return { title, paragraphs, questions, imagePrompt };
}

/** Нижняя граница объёма: короче — текст ощущается обрывком, а не историей. */
const MIN_WORDS = 280;

const countWords = (paragraphs) =>
  paragraphs
    .join(' ')
    .replace(/\*\*/g, '')
    .split(/\s+/)
    .filter(Boolean).length;

app.post('/api/generate', route(async (req, res) => {
  const { genre: genreId, topic } = req.body ?? {};
  if (genreId && genreId !== 'surprise' && !getGenre(genreId)) {
    throw new ApiError(400, 'Неизвестный жанр.');
  }

  const { genre, topic: resolvedTopic, topicWasRandom } = resolveRequest({ genre: genreId, topic });
  const prompt = textPrompt({ genre, topic: resolvedTopic });

  let generated = normalizeGenerated(await askJson({ ...prompt, maxTokens: 3500, effort: 'high' }));

  // Модель иногда экономит на объёме. Одна автоматическая переписка с указанием,
  // насколько текст оказался коротким; если и она не помогла — отдаём что есть.
  const words = countWords(generated.paragraphs);
  if (words < MIN_WORDS) {
    const [firstMessage] = prompt.messages;
    const retry = await askJson({
      system: prompt.system,
      messages: [
        {
          role: 'user',
          content: `${firstMessage.content}

IMPORTANT: a previous attempt came out at only ${words} words, which is too short. This time write 300-380 words across 4-5 full paragraphs of 65-95 words each. Develop the scene properly instead of summarising it.`,
        },
      ],
      maxTokens: 3500,
      effort: 'high',
    });
    const retryGenerated = normalizeGenerated(retry);
    if (countWords(retryGenerated.paragraphs) > words) generated = retryGenerated;
  }

  res.json({
    ...generated,
    topic: resolvedTopic,
    topicWasRandom,
    genre: { id: genre.id, label: genre.label, emoji: genre.emoji },
    imageStyle: genre.imageStyle ?? '',
  });
}));

// ------------------------------------------------------- перевод слова

app.post('/api/word', route(async (req, res) => {
  const word = String(req.body?.word ?? '').trim();
  const sentence = String(req.body?.sentence ?? '').trim();
  const title = String(req.body?.title ?? '').trim();
  const genre = String(req.body?.genre ?? '').trim();
  if (!word) throw new ApiError(400, 'Не передано слово.');

  const data = await askJson({
    ...wordPrompt({ word, sentence, title, genre }),
    maxTokens: 400,
    effort: 'low',
  });

  res.json({
    word: String(data?.word ?? word),
    lemma: String(data?.lemma ?? word),
    translation: String(data?.translation ?? '').trim() || '—',
    pos: String(data?.pos ?? '').trim(),
    note: String(data?.note ?? '').trim(),
  });
}));

// -------------------------------------------------------------- пересказ

app.post('/api/retelling', route(async (req, res) => {
  const retelling = String(req.body?.retelling ?? '').trim();
  const title = String(req.body?.title ?? '').trim();
  const text = String(req.body?.text ?? '').trim();
  if (retelling.length < 20) {
    throw new ApiError(400, 'Пересказ слишком короткий — напишите хотя бы пару предложений.');
  }
  if (!text) throw new ApiError(400, 'Не передан текст.');

  const feedback = await askJson({
    ...retellingPrompt({ title, text, retelling }),
    maxTokens: 2000,
    effort: 'medium',
  });

  res.json(feedback);
}));

// ---------------------------------------------------------------- диалог

app.post('/api/chat', route(async (req, res) => {
  const message = String(req.body?.message ?? '').trim();
  const title = String(req.body?.title ?? '').trim();
  const text = String(req.body?.text ?? '').trim();
  const genre = String(req.body?.genre ?? '').trim();
  if (!text) throw new ApiError(400, 'Не передан текст.');

  const history = Array.isArray(req.body?.history)
    ? req.body.history
        .filter((turn) => turn && (turn.role === 'user' || turn.role === 'assistant') && turn.content)
        .slice(-30)
        .map((turn) => ({ role: turn.role, content: String(turn.content) }))
    : [];

  // Модели нужен user-ход, поэтому старт диалога отправляем как просьбу начать.
  const outgoing = message || "Let's talk about the text. Please start.";
  const messages = [...history, { role: 'user', content: outgoing }];

  const reply = await ask({
    system: chatSystemPrompt({ title, text, genre }),
    messages,
    maxTokens: 700,
    effort: 'low',
  });

  res.json({ reply, sent: outgoing, wasKickoff: !message });
}));

app.post('/api/chat/summary', route(async (req, res) => {
  const title = String(req.body?.title ?? '').trim();
  const turns = Array.isArray(req.body?.history) ? req.body.history : [];
  if (turns.filter((turn) => turn.role === 'user').length < 2) {
    throw new ApiError(400, 'Слишком короткий диалог — напишите хотя бы пару реплик.');
  }

  const transcript = turns
    .map((turn) => `${turn.role === 'user' ? 'LEARNER' : 'TUTOR'}: ${turn.content}`)
    .join('\n\n');

  const summary = await askJson({
    ...chatSummaryPrompt({ title, transcript }),
    maxTokens: 1500,
    effort: 'medium',
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
  console.log(`English Reader → http://localhost:${PORT}  (модель: ${MODEL})`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠  ANTHROPIC_API_KEY не задан — генерация работать не будет. См. .env.example');
  }
});
