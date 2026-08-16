/**
 * Логика интервальных повторений (система Лейтнера).
 *
 * 6 ящиков: 0..5. Интервал — сколько дней слово не показывается после
 * правильного ответа. Ящик 0 = «показать снова прямо сейчас».
 */

import { WORDS } from '../data/words.js';
import { MAX_BOX } from './storage.js';

export const BOX_INTERVALS_DAYS = [0, 1, 3, 7, 16, 30];
export const BOX_COUNT = BOX_INTERVALS_DAYS.length; // 6

const DAY_MS = 24 * 60 * 60 * 1000;

/** Сколько новых (ни разу не показанных) слов добираем в раунд. */
export const NEW_PER_ROUND = 15;
/** Если карточек мало — добираем случайные изученные слова до этого размера. */
export const MIN_ROUND = 20;
/** Верхняя граница раунда, чтобы сессия на телефоне не превращалась в марафон.
 *  Просроченные слова, не влезшие в раунд, попадут в следующий — раундов в день
 *  сколько угодно, никаких суточных блокировок. */
export const MAX_ROUND = 40;
/**
 * Пока столько слов ждут повторения, новые не открываем (в раунде их «до 15»).
 * Иначе новые слова вытесняют повторения: долг растёт быстрее, чем разгребается,
 * и слова застревают в младших ящиках, так и не доходя до 4-5.
 * Разгребли долг — новые снова пошли.
 */
export const BACKLOG_PAUSE = 60;

export function intervalMs(box) {
  const idx = Math.min(Math.max(0, box), BOX_INTERVALS_DAYS.length - 1);
  return BOX_INTERVALS_DAYS[idx] * DAY_MS;
}

/** Новое состояние слова после ответа «знал». */
export function promote(record, now = Date.now()) {
  const box = Math.min(MAX_BOX, (record?.box ?? 0) + 1);
  return { box, due: now + intervalMs(box) };
}

/** Новое состояние слова после ответа «не знал»: в самый первый ящик. */
export function demote(now = Date.now()) {
  return { box: 0, due: now + intervalMs(0) };
}

/** Сколько новых слов можно взять в раунд при текущем долге повторений. */
export function newWordsAllowed(dueCount) {
  return dueCount >= BACKLOG_PAUSE ? 0 : NEW_PER_ROUND;
}

function shuffle(list, rnd = Math.random) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Собирает очередь слов на раунд.
 *
 * Порядок наполнения:
 *   1) все слова, у которых подошёл срок повторения (due <= now);
 *   2) до 15 новых слов, которые ещё ни разу не показывались;
 *   3) если карточек всё ещё мало — случайные уже изученные слова
 *      (свободная тренировка, сроки повторения при этом не ломаются).
 *
 * @returns {{ queue: string[], counts: { due: number, fresh: number, extra: number } }}
 */
export function buildRound(progress, now = Date.now(), rnd = Math.random) {
  const due = [];
  const fresh = [];
  const rest = [];

  for (const word of WORDS) {
    const rec = progress[word.en];
    if (!rec) fresh.push(word.en);
    else if (rec.due <= now) due.push(word.en);
    else rest.push(word.en);
  }

  // Сначала самые «забытые» — с меньшим ящиком, среди равных случайно.
  const dueSorted = shuffle(due, rnd).sort(
    (a, b) => (progress[a]?.box ?? 0) - (progress[b]?.box ?? 0),
  );

  // Место под новые слова резервируем заранее: иначе при большом «долге»
  // повторений новые слова перестали бы появляться совсем. А если долг уже
  // велик — наоборот, делаем паузу в наборе новых, пока не разгребём.
  const freshPicked = fresh.slice(0, newWordsAllowed(due.length));
  const picked = dueSorted.slice(0, MAX_ROUND - freshPicked.length);
  const counts = { due: picked.length, fresh: freshPicked.length, extra: 0 };
  picked.push(...freshPicked);

  if (picked.length < MIN_ROUND) {
    const extra = shuffle(rest, rnd).slice(0, MIN_ROUND - picked.length);
    counts.extra = extra.length;
    picked.push(...extra);
  }

  return { queue: shuffle(picked, rnd), counts };
}

/** Сколько слов сейчас ждут повторения. */
export function countDue(progress, now = Date.now()) {
  let n = 0;
  for (const word of WORDS) {
    const rec = progress[word.en];
    if (rec && rec.due <= now) n += 1;
  }
  return n;
}

/** Распределение слов по ящикам + сколько ещё не начато. */
export function boxDistribution(progress) {
  const boxes = new Array(BOX_COUNT).fill(0);
  let untouched = 0;
  for (const word of WORDS) {
    const rec = progress[word.en];
    if (!rec) untouched += 1;
    else boxes[Math.min(MAX_BOX, Math.max(0, rec.box))] += 1;
  }
  return { boxes, untouched, total: WORDS.length };
}

/** Человеческое описание интервала ящика. */
export function boxLabel(box) {
  const days = BOX_INTERVALS_DAYS[box];
  if (days === 0) return 'сейчас';
  if (days === 1) return '1 день';
  return `${days} дн.`;
}
