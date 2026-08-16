/**
 * Хранение прогресса и статистики.
 *
 * Всё пишется в localStorage синхронно, сразу при каждом ответе — данные
 * лёгкие (сотни коротких записей), дебаунс не нужен. Никаких сетевых вызовов.
 *
 * Ключи:
 *   vocab-progress : { [en]: { box: 0..5, due: timestamp } }
 *   vocab-stats    : { byDate: { "YYYY-MM-DD": { sessions, right, wrong } },
 *                      totalSessions, totalRight, totalWrong }
 *   vocab-settings : { direction: 'en-ru' | 'ru-en' }   (мелкие настройки UI)
 *   vocab-seed     : "1"  — отметка, что разовый импорт старых данных уже сделан
 */

export const PROGRESS_KEY = 'vocab-progress';
export const STATS_KEY = 'vocab-stats';
export const SETTINGS_KEY = 'vocab-settings';
export const SEED_KEY = 'vocab-seed';

/**
 * localStorage может быть недоступен (приватный режим Safari, отключённые
 * куки, переполнение квоты). Тогда переключаемся на память в рамках вкладки,
 * чтобы приложение не падало, и поднимаем флаг для предупреждения в UI.
 */
let memoryFallback = null;

function makeMemoryStore() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

function store() {
  if (memoryFallback) return memoryFallback;
  try {
    const probe = '__vocab_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    memoryFallback = makeMemoryStore();
    return memoryFallback;
  }
}

export function isPersistent() {
  store();
  return memoryFallback === null;
}

function readRaw(key) {
  try {
    return store().getItem(key);
  } catch {
    return null;
  }
}

function readJSON(key) {
  const raw = readRaw(key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJSON(key, value) {
  try {
    store().setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Квота кончилась или запись запрещена — уходим в память,
    // чтобы сессия хотя бы доработала до конца.
    if (!memoryFallback) memoryFallback = makeMemoryStore();
    try {
      memoryFallback.setItem(key, JSON.stringify(value));
    } catch {
      /* дальше падать некуда */
    }
    return false;
  }
}

/* ---------- нормализация (защита от битых/чужих данных) ---------- */

export const MAX_BOX = 5;

function normalizeProgress(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [en, rec] of Object.entries(raw)) {
    if (!rec || typeof rec !== 'object') continue;
    const box = Number(rec.box);
    const due = Number(rec.due);
    if (!Number.isFinite(box) || !Number.isFinite(due)) continue;
    out[en] = {
      box: Math.min(MAX_BOX, Math.max(0, Math.round(box))),
      due: Math.round(due),
    };
  }
  return out;
}

function normalizeDayStat(rec) {
  const num = (v) => (Number.isFinite(Number(v)) ? Math.max(0, Math.round(Number(v))) : 0);
  return { sessions: num(rec?.sessions), right: num(rec?.right), wrong: num(rec?.wrong) };
}

export function emptyStats() {
  return { byDate: {}, totalSessions: 0, totalRight: 0, totalWrong: 0 };
}

function normalizeStats(raw) {
  const out = emptyStats();
  if (!raw || typeof raw !== 'object') return out;
  if (raw.byDate && typeof raw.byDate === 'object') {
    for (const [date, rec] of Object.entries(raw.byDate)) {
      out.byDate[normalizeDateKey(date)] = normalizeDayStat(rec);
    }
  }
  const num = (v) => (Number.isFinite(Number(v)) ? Math.max(0, Math.round(Number(v))) : 0);
  out.totalSessions = num(raw.totalSessions);
  out.totalRight = num(raw.totalRight);
  out.totalWrong = num(raw.totalWrong);
  return out;
}

/** "2026-8-16" (старый формат) -> "2026-08-16" */
export function normalizeDateKey(key) {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(key));
  if (!m) return String(key);
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
}

/** Локальная дата в формате YYYY-MM-DD (не UTC — день считается по часам телефона). */
export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/* ---------- публичное API ---------- */

export function loadProgress() {
  return normalizeProgress(readJSON(PROGRESS_KEY));
}

export function saveProgress(progress) {
  return writeJSON(PROGRESS_KEY, progress);
}

export function loadStats() {
  return normalizeStats(readJSON(STATS_KEY));
}

export function saveStats(stats) {
  return writeJSON(STATS_KEY, stats);
}

export function loadSettings() {
  const raw = readJSON(SETTINGS_KEY);
  const direction = raw?.direction === 'ru-en' ? 'ru-en' : 'en-ru';
  return { direction };
}

export function saveSettings(settings) {
  return writeJSON(SETTINGS_KEY, settings);
}

/** Полный сброс: пишем пустые объекты (а не удаляем), чтобы импорт не сработал заново. */
export function resetAll() {
  saveProgress({});
  saveStats(emptyStats());
  writeJSON(SEED_KEY, '1');
}

/* ---------- разовый импорт данных из старой версии ---------- */

/**
 * Данные прогресса из предыдущей (черновой) версии тренажёра.
 * Подставляются ровно один раз — при первом запуске на пустом хранилище.
 */
export const LEGACY_SNAPSHOT = {
  v: 1,
  progress: {
    away: { box: 1, due: 1786989112266 },
    abuse: { box: 1, due: 1786989120504 },
    rest: { box: 1, due: 1786989122386 },
    lunch: { box: 1, due: 1786989125138 },
    explosion: { box: 1, due: 1786989194911 },
    knee: { box: 1, due: 1786989168546 },
    tired: { box: 1, due: 1786989135272 },
    improve: { box: 1, due: 1786989170191 },
    curiously: { box: 1, due: 1786989171938 },
    achieve: { box: 1, due: 1786989197229 },
    under: { box: 1, due: 1786989199479 },
    relief: { box: 1, due: 1786989201708 },
    firm: { box: 1, due: 1786989188094 },
    glass: { box: 1, due: 1786989159189 },
    endure: { box: 1, due: 1786989205512 },
  },
  statsLog: {
    byDate: { '2026-8-16': { sessions: 1, right: 15, wrong: 15 } },
    totalSessions: 1,
    totalRight: 15,
    totalWrong: 15,
  },
};

/**
 * Если хранилище ещё пустое — переносим старый прогресс и статистику.
 * Отметка SEED_KEY гарантирует, что импорт не повторится после сброса.
 * @returns {boolean} был ли выполнен импорт
 */
export function seedFromLegacyIfEmpty() {
  const alreadySeeded = readRaw(SEED_KEY) != null;
  const hasProgress = readRaw(PROGRESS_KEY) != null;
  const hasStats = readRaw(STATS_KEY) != null;
  if (alreadySeeded || hasProgress || hasStats) return false;

  saveProgress(normalizeProgress(LEGACY_SNAPSHOT.progress));
  saveStats(normalizeStats(LEGACY_SNAPSHOT.statsLog));
  writeJSON(SEED_KEY, '1');
  return true;
}

/* ---------- ручной экспорт/импорт (страховка перед сменой браузера) ---------- */

export function exportSnapshot() {
  return JSON.stringify({ v: 1, progress: loadProgress(), statsLog: loadStats() }, null, 2);
}

export function importSnapshot(text) {
  const parsed = JSON.parse(text);
  const progress = normalizeProgress(parsed.progress);
  const stats = normalizeStats(parsed.statsLog ?? parsed.stats);
  saveProgress(progress);
  saveStats(stats);
  writeJSON(SEED_KEY, '1');
  return { progress, stats };
}
