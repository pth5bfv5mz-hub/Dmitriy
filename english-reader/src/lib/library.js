/**
 * Библиотека текстов.
 *
 * Встроенные тексты (content/) лежат в самом приложении и доступны всегда —
 * без ключа, без интернета и без денег. Прогресс по ним (пройденный тест,
 * посмотренные слова, пересказ, диалог) хранится отдельно, в localStorage.
 *
 * Тексты, созданные ИИ, хранятся в localStorage целиком.
 */
import { BUILTIN_TEXTS } from '../../content/index.js';

const KEY = 'english-reader:library:v1';
const PROGRESS_KEY = 'english-reader:progress:v1';

/** Поля, которые меняются во время работы с текстом. */
const PROGRESS_FIELDS = [
  'status',
  'lastStep',
  'glossary',
  'quizResult',
  'retelling',
  'chat',
  'chatSummary',
  'selfCheck',
];

const EMPTY_PROGRESS = { status: 'new', lastStep: 'read', glossary: {} };

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error(
      'В браузере закончилось место для сохранения. Удалите несколько своих текстов из библиотеки.',
    );
  }
}

const readUserTexts = () => {
  const list = read(KEY, []);
  return Array.isArray(list) ? list : [];
};
const readProgress = () => read(PROGRESS_KEY, {}) ?? {};

const isBuiltIn = (id) => String(id).startsWith('b:');

const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const STATUS_ORDER = ['new', 'reading', 'quiz_done', 'chat_done'];

/** Встроенный текст = содержимое из кода + прогресс из localStorage. */
function mergeBuiltIn(text, progress) {
  return { ...text, ...EMPTY_PROGRESS, ...(progress[text.id] ?? {}) };
}

function summarise(text) {
  return {
    id: text.id,
    title: text.title,
    topic: text.topic,
    genre: text.genre ?? null,
    builtIn: Boolean(text.builtIn),
    status: text.status ?? 'new',
    lastStep: text.lastStep ?? 'read',
    createdAt: text.createdAt ?? null,
    wordCount: (text.paragraphs ?? []).join(' ').replace(/\*\*/g, '').split(/\s+/).filter(Boolean)
      .length,
    lookedUpWords: Object.keys(text.glossary ?? {}).length,
    quiz: text.quizResult ? { correct: text.quizResult.correct, total: text.quizResult.total } : null,
  };
}

export function listTexts() {
  const progress = readProgress();
  const own = readUserTexts()
    .map(summarise)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const builtIn = BUILTIN_TEXTS.map((text) => summarise(mergeBuiltIn(text, progress)));
  return [...own, ...builtIn];
}

export function getText(id) {
  if (isBuiltIn(id)) {
    const text = BUILTIN_TEXTS.find((item) => item.id === id);
    return text ? mergeBuiltIn(text, readProgress()) : null;
  }
  return readUserTexts().find((text) => text.id === id) ?? null;
}

export function createText(generated) {
  const text = {
    id: newId(),
    ...generated,
    createdAt: new Date().toISOString(),
    ...EMPTY_PROGRESS,
    quizResult: null,
    retelling: null,
    chat: [],
    chatSummary: null,
  };
  write(KEY, [text, ...readUserTexts()]);
  return text;
}

export function removeText(id) {
  if (isBuiltIn(id)) {
    // Встроенный текст удалить нельзя — сбрасываем только прогресс по нему.
    const progress = readProgress();
    delete progress[id];
    write(PROGRESS_KEY, progress);
    return;
  }
  write(KEY, readUserTexts().filter((text) => text.id !== id));
}

/** Изменить текст: mutator меняет объект на месте. */
export function updateText(id, mutator) {
  if (isBuiltIn(id)) {
    const progress = readProgress();
    const text = getText(id);
    if (!text) return null;

    mutator(text);
    progress[id] = Object.fromEntries(
      PROGRESS_FIELDS.filter((field) => text[field] !== undefined).map((field) => [field, text[field]]),
    );
    write(PROGRESS_KEY, progress);
    return { ...text };
  }

  const texts = readUserTexts();
  const text = texts.find((item) => item.id === id);
  if (!text) return null;
  mutator(text);
  write(KEY, texts);
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
