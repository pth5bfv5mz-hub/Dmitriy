/**
 * Поиск слова во встроенном словаре.
 *
 * Словарь хранит начальные формы, а в тексте слово встречается изменённым:
 * stopped, running, cities, quietly. Поэтому если точного совпадения нет,
 * пробуем отбросить типичные окончания и поискать основу.
 */

const DOUBLED = /([bdfglmnprt])\1$/;

function candidates(word) {
  const list = [];
  const add = (value) => value.length > 1 && list.push(value);

  if (word.endsWith('ies')) add(`${word.slice(0, -3)}y`);
  if (word.endsWith('es')) add(word.slice(0, -2));
  if (word.endsWith('s')) add(word.slice(0, -1));

  if (word.endsWith('ied')) add(`${word.slice(0, -3)}y`);
  if (word.endsWith('ed')) {
    const stem = word.slice(0, -2);
    add(stem);
    add(word.slice(0, -1));
    if (DOUBLED.test(stem)) add(stem.slice(0, -1));
  }

  if (word.endsWith('ing')) {
    const stem = word.slice(0, -3);
    add(stem);
    add(`${stem}e`);
    if (DOUBLED.test(stem)) add(stem.slice(0, -1));
  }

  if (word.endsWith('ly')) {
    add(word.slice(0, -2));
    if (word.endsWith('ily')) add(`${word.slice(0, -3)}y`);
  }

  if (word.endsWith('est')) add(word.slice(0, -3));
  if (word.endsWith('er')) add(word.slice(0, -2));
  if (word.endsWith('ier')) add(`${word.slice(0, -3)}y`);

  return list;
}

/**
 * Возвращает { translation, lemma, pos, note } или null.
 */
export function lookupWord(dictionary, raw) {
  if (!dictionary) return null;

  const word = String(raw).toLowerCase().replace(/[’']s$/, '');
  const entry = dictionary[word];
  if (entry) {
    return {
      translation: entry.t,
      lemma: entry.l ?? word,
      pos: entry.p ?? '',
      note: entry.n ?? '',
    };
  }

  for (const candidate of candidates(word)) {
    const found = dictionary[candidate];
    if (found) {
      return {
        translation: found.t,
        lemma: found.l ?? candidate,
        pos: found.p ?? '',
        note: found.n ?? '',
      };
    }
  }

  return null;
}
