/**
 * Служебные слова: их переводить бессмысленно, а подчёркивание каждого слова
 * мешает чтению. Такие токены рендерятся обычным текстом и не кликаются.
 */
const FUNCTION_WORDS = new Set(
  `a an the and or but so if then than that this these those there here
   i you he she it we they me him her us them my your his its our their mine yours
   is am are was were be been being do does did doing done have has had having
   will would shall should can could may might must
   of in on at to from by for with without into onto over under about after before
   between through during against above below up down out off again once
   not no nor as too very just only also even still yet
   what which who whom whose when where why how
   all any both each few more most other some such own same
   ll re ve s t d m`
    .split(/\s+/)
    .filter(Boolean),
);

const WORD_PATTERN = /[A-Za-z]+(?:['’][A-Za-z]+)*/g;

/**
 * Разбивает абзац на предложения (нужно для контекста при переводе слова).
 * Пробелы между предложениями намеренно сохраняются: они попадают в токены
 * и не дают словам слипнуться при отрисовке.
 */
export function splitSentences(paragraph) {
  const matches = paragraph.match(/[^.!?]+[.!?]*\s*/g);
  return matches?.filter((sentence) => sentence.trim()) ?? [paragraph];
}

/**
 * Разбивает предложение на токены для рендера.
 * { type: 'word' | 'plain', value, clickable, bold }
 *
 * Пары ** включают и выключают жирное начертание (так модель выделяет
 * фразу-крючок в начале и главную мысль в конце). Сами звёздочки на экран
 * не попадают.
 */
export function tokenize(sentence) {
  const tokens = [];
  let bold = false;

  for (const chunk of sentence.split('**')) {
    let lastIndex = 0;

    for (const match of chunk.matchAll(WORD_PATTERN)) {
      if (match.index > lastIndex) {
        tokens.push({ type: 'plain', value: chunk.slice(lastIndex, match.index), bold });
      }
      const value = match[0];
      tokens.push({
        type: 'word',
        value,
        bold,
        clickable: !FUNCTION_WORDS.has(value.toLowerCase().replace(/['’]/g, '')) && value.length > 1,
      });
      lastIndex = match.index + value.length;
    }

    if (lastIndex < chunk.length) {
      tokens.push({ type: 'plain', value: chunk.slice(lastIndex), bold });
    }
    bold = !bold;
  }

  return tokens;
}

/** Текст без служебных звёздочек — для контекста перевода и подсчёта слов. */
export const stripEmphasis = (text) => text.replace(/\*\*/g, '');

export function normalizeWord(word) {
  return word.toLowerCase().replace(/['’]/g, "'");
}

export const STATUS_LABELS = {
  new: { label: 'не начат', tone: 'muted' },
  reading: { label: 'читаю', tone: 'progress' },
  quiz_done: { label: 'тест пройден', tone: 'good' },
  chat_done: { label: 'диалог завершён', tone: 'done' },
};

/** Склонение существительного после числа: 1 слово, 2 слова, 5 слов. */
export function plural(count, [one, few, many]) {
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  const mod10 = count % 10;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

export const words = (count) => `${count} ${plural(count, ['слово', 'слова', 'слов'])}`;

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
