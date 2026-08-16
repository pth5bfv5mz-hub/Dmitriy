/** Работа со статистикой: чистые функции над объектом vocab-stats. */

import { todayKey, emptyStats } from './storage.js';

function ensureDay(stats, date) {
  if (!stats.byDate[date]) stats.byDate[date] = { sessions: 0, right: 0, wrong: 0 };
  return stats.byDate[date];
}

/** Возвращает НОВЫЙ объект статистики с зачтённым ответом. */
export function withAnswer(stats, known, date = todayKey()) {
  const next = { ...stats, byDate: { ...stats.byDate } };
  const prev = next.byDate[date] ?? { sessions: 0, right: 0, wrong: 0 };
  const day = { ...prev };
  next.byDate[date] = day;
  if (known) {
    day.right += 1;
    next.totalRight += 1;
  } else {
    day.wrong += 1;
    next.totalWrong += 1;
  }
  return next;
}

/** Возвращает НОВЫЙ объект статистики с зачтённым началом раунда. */
export function withSessionStart(stats, date = todayKey()) {
  const next = { ...stats, byDate: { ...stats.byDate } };
  const prev = next.byDate[date] ?? { sessions: 0, right: 0, wrong: 0 };
  next.byDate[date] = { ...prev, sessions: prev.sessions + 1 };
  next.totalSessions += 1;
  return next;
}

export function dayStat(stats, date = todayKey()) {
  return stats?.byDate?.[date] ?? { sessions: 0, right: 0, wrong: 0 };
}

/** Точность в процентах (0..100) или null, если ответов ещё не было. */
export function accuracy(right, wrong) {
  const total = right + wrong;
  if (total === 0) return null;
  return Math.round((right / total) * 100);
}

const WEEKDAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

/** Последние n дней (включая сегодня) для графика активности. */
export function lastDays(stats, n = 7, today = new Date()) {
  const out = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const key = todayKey(d);
    const rec = dayStat(stats, key);
    out.push({
      key,
      label: WEEKDAYS[d.getDay()],
      dayNum: d.getDate(),
      isToday: i === 0,
      ...rec,
      total: rec.right + rec.wrong,
    });
  }
  return out;
}

export { emptyStats };
