/**
 * Встроенная библиотека текстов — работает без интернета, ключа и денег.
 *
 * Каждый текст: id, title, topic, genre, paragraphs (с **жирными** выделениями),
 * questions (тест), keyPoints и modelRetelling (для самопроверки пересказа),
 * discussion (вопросы для разговора), glossary (слова именно этого текста).
 *
 * Слова, которых нет в glossary текста, ищутся в общем словаре base-dictionary.js.
 */
import baseDictionary from './base-dictionary.js';
import lift from './lift.js';
import setA from './set-a.js';
import setB from './set-b.js';
import setC from './set-c.js';
import setD from './set-d.js';
import setE from './set-e.js';
import setF from './set-f.js';

const GENRE_STYLES = {
  motivation: 'warm editorial photography, soft daylight, quiet everyday scene',
  life: 'candid documentary photography, natural light, ordinary domestic detail',
  horror: 'moody cinematic film photograph, deep shadows, cold light, unsettling emptiness',
  thriller: 'tense cinematic still, high contrast, night city light, sense of motion',
  mystery: 'noir photograph, desk lamp light, rain on glass, muted colours',
  science: 'clean scientific illustration, minimal, elegant diagrammatic style',
  scifi: 'near-future concept art, restrained palette, believable everyday technology',
  weird: 'surreal photograph, dreamlike but calm, one impossible detail',
};

/** Словарь текста + общий словарь; значения приводятся к единому виду. */
function buildDictionary(glossary = {}) {
  const entry = (value) => (typeof value === 'string' ? { t: value } : value);
  const dictionary = {};

  for (const [word, value] of Object.entries(baseDictionary)) {
    dictionary[word] = entry(value);
  }
  // Слова текста важнее: у них перевод под конкретный контекст.
  for (const [word, value] of Object.entries(glossary)) {
    dictionary[word.toLowerCase()] = entry(value);
  }
  return dictionary;
}

export const BUILTIN_TEXTS = [lift, ...setA, ...setB, ...setC, ...setD, ...setE, ...setF].map((text, index) => ({
  ...text,
  id: `b:${text.id}`,
  builtIn: true,
  order: index,
  imageStyle: text.imageStyle ?? GENRE_STYLES[text.genre?.id] ?? '',
  dictionary: buildDictionary(text.glossary),
  glossary: undefined,
}));

export const BUILTIN_COUNT = BUILTIN_TEXTS.length;
