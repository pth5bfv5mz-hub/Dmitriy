/**
 * Библиотека текстов хранится в localStorage браузера.
 *
 * Так приложение работает на любом бесплатном хостинге: сервер можно
 * перезапускать сколько угодно, данные пользователя от этого не страдают.
 * Плата за это — библиотека своя на каждом устройстве.
 */

const KEY = 'english-reader:library:v1';

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(texts) {
  try {
    localStorage.setItem(KEY, JSON.stringify(texts));
    return true;
  } catch (error) {
    // Место в localStorage кончилось (обычно ~5 МБ) — сообщаем наверх.
    throw new Error(
      'В браузере закончилось место для сохранения. Удалите несколько старых текстов из библиотеки.',
    );
  }
}

const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const STATUS_ORDER = ['new', 'reading', 'quiz_done', 'chat_done'];

export function listTexts() {
  return readAll()
    .map((text) => ({
      id: text.id,
      title: text.title,
      topic: text.topic,
      genre: text.genre ?? null,
      status: text.status ?? 'new',
      lastStep: text.lastStep ?? 'read',
      createdAt: text.createdAt,
      wordCount: (text.paragraphs ?? []).join(' ').replace(/\*\*/g, '').split(/\s+/).filter(Boolean).length,
      lookedUpWords: Object.keys(text.glossary ?? {}).length,
      quiz: text.quizResult
        ? { correct: text.quizResult.correct, total: text.quizResult.total }
        : null,
    }))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function getText(id) {
  return readAll().find((text) => text.id === id) ?? null;
}

export function createText(generated) {
  const text = {
    id: newId(),
    ...generated,
    createdAt: new Date().toISOString(),
    status: 'new',
    lastStep: 'read',
    glossary: {},
    quizResult: null,
    retelling: null,
    chat: [],
    chatSummary: null,
  };
  writeAll([text, ...readAll()]);
  return text;
}

export function removeText(id) {
  writeAll(readAll().filter((text) => text.id !== id));
}

/** Изменить текст: mutator меняет объект на месте. Возвращает обновлённый текст. */
export function updateText(id, mutator) {
  const texts = readAll();
  const text = texts.find((item) => item.id === id);
  if (!text) return null;
  mutator(text);
  writeAll(texts);
  return { ...text };
}

/** Статус только растёт: возврат к чтению не сбрасывает пройденный тест. */
export function advanceStatus(text, status) {
  if (STATUS_ORDER.indexOf(status) > STATUS_ORDER.indexOf(text.status ?? 'new')) {
    text.status = status;
  }
}

/** Ключ кэша перевода: слово + начало предложения, в котором оно встретилось. */
export const glossaryKey = (word, sentence) =>
  `${word.toLowerCase()}::${sentence.slice(0, 60).toLowerCase()}`;
