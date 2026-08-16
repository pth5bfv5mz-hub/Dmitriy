/**
 * Работа без сервера: браузер сам собирает промпты и ходит в Anthropic.
 * Повторяет логику server/index.js — промпты и каталог жанров общие,
 * лежат в shared/, поэтому расходиться версиям неоткуда.
 */
import { GENRES, getGenre, resolveRequest } from '../../shared/genres.js';
import {
  chatSummaryPrompt,
  chatSystemPrompt,
  retellingPrompt,
  textPrompt,
  wordPrompt,
} from '../../shared/prompts.js';
import { ask, askJson, getKey, MODEL } from './anthropic.js';

const MIN_WORDS = 280;

const countWords = (paragraphs) =>
  paragraphs.join(' ').replace(/\*\*/g, '').split(/\s+/).filter(Boolean).length;

function normalizeGenerated(data) {
  const title = typeof data?.title === 'string' ? data.title.trim() : '';
  const paragraphs = Array.isArray(data?.paragraphs)
    ? data.paragraphs.map((item) => String(item).trim()).filter(Boolean)
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
    throw new Error('Модель вернула текст в неожиданном формате. Попробуйте ещё раз.');
  }

  return {
    title,
    paragraphs,
    questions,
    imagePrompt: typeof data?.imagePrompt === 'string' ? data.imagePrompt.trim().slice(0, 300) : '',
  };
}

export const directApi = {
  health: async () => ({ ok: true, model: MODEL, hasKey: Boolean(getKey()), mode: 'direct' }),

  genres: async () =>
    GENRES.map(({ id, label, emoji, description, topics }) => ({
      id,
      label,
      emoji,
      description,
      topics,
    })),

  async generate({ genre: genreId, topic }) {
    if (genreId && genreId !== 'surprise' && !getGenre(genreId)) {
      throw new Error('Неизвестный жанр.');
    }

    const { genre, topic: resolvedTopic, topicWasRandom } = resolveRequest({ genre: genreId, topic });
    const prompt = textPrompt({ genre, topic: resolvedTopic });

    let generated = normalizeGenerated(await askJson({ ...prompt, maxTokens: 3500, effort: 'high' }));

    // Если модель сэкономила на объёме — одна автоматическая переписка.
    const wordCount = countWords(generated.paragraphs);
    if (wordCount < MIN_WORDS) {
      const [firstMessage] = prompt.messages;
      const retry = normalizeGenerated(
        await askJson({
          system: prompt.system,
          messages: [
            {
              role: 'user',
              content: `${firstMessage.content}

IMPORTANT: a previous attempt came out at only ${wordCount} words, which is too short. This time write 300-380 words across 4-5 full paragraphs of 65-95 words each. Develop the scene properly instead of summarising it.`,
            },
          ],
          maxTokens: 3500,
          effort: 'high',
        }),
      );
      if (countWords(retry.paragraphs) > wordCount) generated = retry;
    }

    return {
      ...generated,
      topic: resolvedTopic,
      topicWasRandom,
      genre: { id: genre.id, label: genre.label, emoji: genre.emoji },
      imageStyle: genre.imageStyle ?? '',
    };
  },

  async translateWord({ word, sentence, title, genre }) {
    const data = await askJson({
      ...wordPrompt({ word, sentence, title, genre }),
      maxTokens: 400,
      effort: 'low',
    });

    return {
      word: String(data?.word ?? word),
      lemma: String(data?.lemma ?? word),
      translation: String(data?.translation ?? '').trim() || '—',
      pos: String(data?.pos ?? '').trim(),
      note: String(data?.note ?? '').trim(),
    };
  },

  async checkRetelling({ title, text, retelling }) {
    if (retelling.trim().length < 20) {
      throw new Error('Пересказ слишком короткий — напишите хотя бы пару предложений.');
    }
    return askJson({
      ...retellingPrompt({ title, text, retelling }),
      maxTokens: 2000,
      effort: 'medium',
    });
  },

  async chat({ title, text, genre, history, message }) {
    const outgoing = message || "Let's talk about the text. Please start.";
    const trimmed = (history ?? [])
      .filter((turn) => turn && (turn.role === 'user' || turn.role === 'assistant') && turn.content)
      .slice(-30)
      .map((turn) => ({ role: turn.role, content: String(turn.content) }));

    const reply = await ask({
      system: chatSystemPrompt({ title, text, genre }),
      messages: [...trimmed, { role: 'user', content: outgoing }],
      maxTokens: 700,
      effort: 'low',
    });

    return { reply, sent: outgoing, wasKickoff: !message };
  },

  async chatSummary({ title, history }) {
    const turns = history ?? [];
    if (turns.filter((turn) => turn.role === 'user').length < 2) {
      throw new Error('Слишком короткий диалог — напишите хотя бы пару реплик.');
    }
    const transcript = turns
      .map((turn) => `${turn.role === 'user' ? 'LEARNER' : 'TUTOR'}: ${turn.content}`)
      .join('\n\n');

    return askJson({
      ...chatSummaryPrompt({ title, transcript }),
      maxTokens: 1500,
      effort: 'medium',
    });
  },
};
