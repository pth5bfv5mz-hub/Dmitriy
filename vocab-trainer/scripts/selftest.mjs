/**
 * Проверки логики без браузера: node scripts/selftest.mjs
 * Подменяем window.localStorage на память и гоняем сценарии Лейтнера.
 */

const mem = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
  },
};

const storage = await import('../src/lib/storage.js');
const leitner = await import('../src/lib/leitner.js');
const statsLib = await import('../src/lib/stats.js');
const { WORDS } = await import('../src/data/words.js');

let failed = 0;
function check(name, cond, extra = '') {
  if (cond) console.log(`  ok  ${name}`);
  else {
    failed += 1;
    console.log(`FAIL  ${name} ${extra}`);
  }
}

const DAY = 24 * 60 * 60 * 1000;

/* --- словарь --- */
check('621 слово', WORDS.length === 621, WORDS.length);
check('нет дублей', new Set(WORDS.map((w) => w.en)).size === WORDS.length);
check(
  'у всех есть перевод',
  WORDS.every((w) => w.en && w.ru),
);

/* --- разовый импорт --- */
check('импорт сработал', storage.seedFromLegacyIfEmpty() === true);
let progress = storage.loadProgress();
check('перенесено 15 слов', Object.keys(progress).length === 15, Object.keys(progress).length);
check('away в ящике 1', progress.away.box === 1);
let stats = storage.loadStats();
check('дата нормализована', '2026-08-16' in stats.byDate, Object.keys(stats.byDate));
check('итоги перенесены', stats.totalRight === 15 && stats.totalWrong === 15);
check('повторный импорт не делается', storage.seedFromLegacyIfEmpty() === false);

/* --- интервалы --- */
check('интервалы', JSON.stringify(leitner.BOX_INTERVALS_DAYS) === '[0,1,3,7,16,30]');
const now = Date.now();
check('новое слово -> ящик 1, +1 день', (() => {
  const r = leitner.promote(undefined, now);
  return r.box === 1 && r.due === now + DAY;
})());
check('ящик 4 -> 5, +30 дней', (() => {
  const r = leitner.promote({ box: 4, due: 0 }, now);
  return r.box === 5 && r.due === now + 30 * DAY;
})());
check('ящик 5 не растёт', leitner.promote({ box: 5, due: 0 }, now).box === 5);
check('ошибка -> ящик 0, сразу', (() => {
  const r = leitner.demote(now);
  return r.box === 0 && r.due === now;
})());

/* --- сбор раунда --- */
const r1 = leitner.buildRound(progress, now);
check('в раунде есть новые слова', r1.counts.fresh === 15, JSON.stringify(r1.counts));
check('просроченных нет (due в будущем)', r1.counts.due === 0);
check('добор до минимума', r1.queue.length >= leitner.MIN_ROUND, r1.queue.length);
check('без повторов в очереди', new Set(r1.queue).size === r1.queue.length);

// Всё просрочено -> раунд ограничен MAX_ROUND
const allDue = Object.fromEntries(WORDS.map((w) => [w.en, { box: 2, due: now - DAY }]));
const r2 = leitner.buildRound(allDue, now);
check('раунд не длиннее MAX_ROUND', r2.queue.length === leitner.MAX_ROUND, r2.queue.length);
check('счётчик просроченных', leitner.countDue(allDue, now) === WORDS.length);

// Сначала более «слабые» ящики
const mixed = {};
WORDS.slice(0, 60).forEach((w, i) => {
  mixed[w.en] = { box: i < 30 ? 5 : 0, due: now - DAY };
});
const r3 = leitner.buildRound(mixed, now);
const weakFirst = r3.queue.filter((en) => mixed[en]?.box === 0).length;
// Слабые (ящик 0) должны попасть в раунд все до единого, прежде чем возьмут
// слова из ящика 5 — те тоже просрочены, но помнятся лучше.
check('все слабые слова взяты в раунд', weakFirst === 30, weakFirst);
check(
  'слабые приоритетнее сильных',
  weakFirst >= r3.queue.filter((en) => mixed[en]?.box === 5).length,
);

/* --- пауза в наборе новых при большом долге --- */
check('при долге 60+ новые не набираются', leitner.newWordsAllowed(60) === 0);
check('при малом долге новые идут', leitner.newWordsAllowed(59) === leitner.NEW_PER_ROUND);
const bigBacklog = {};
WORDS.slice(0, 100).forEach((w) => {
  bigBacklog[w.en] = { box: 1, due: now - DAY };
});
const r5 = leitner.buildRound(bigBacklog, now);
check('раунд при долге состоит из повторений', r5.counts.fresh === 0 && r5.counts.due === leitner.MAX_ROUND, JSON.stringify(r5.counts));

/* --- пустой прогресс --- */
const r4 = leitner.buildRound({}, now);
check('на старте 15 новых + добор', r4.counts.fresh === 15 && r4.queue.length === 15, JSON.stringify(r4.counts));

/* --- статистика --- */
let s = storage.emptyStats();
s = statsLib.withSessionStart(s, '2026-08-16');
s = statsLib.withAnswer(s, true, '2026-08-16');
s = statsLib.withAnswer(s, false, '2026-08-16');
check('сессии считаются', s.totalSessions === 1 && s.byDate['2026-08-16'].sessions === 1);
check('ответы считаются', s.totalRight === 1 && s.totalWrong === 1);
check('исходный объект не мутирован', storage.emptyStats().totalRight === 0);
check('точность', statsLib.accuracy(3, 1) === 75 && statsLib.accuracy(0, 0) === null);
const week = statsLib.lastDays(s, 7, new Date('2026-08-16T12:00:00'));
check('7 дней в графике', week.length === 7 && week[6].isToday && week[6].total === 2);

/* --- симуляция 40 дней занятий: 3 раунда в день, 80% верных ответов --- */
progress = {};
let simStats = storage.emptyStats();
let t = now;
let stuck = 0;
for (let day = 0; day < 40; day += 1) {
  t = now + day * DAY;
  for (let round = 0; round < 3; round += 1) {
    const { queue } = leitner.buildRound(progress, t);
    const q = queue.slice();
    let guard = 0;
    while (q.length && guard < 9000) {
      guard += 1;
      const en = q.shift();
      const known = Math.random() < 0.8;
      progress = { ...progress, [en]: known ? leitner.promote(progress[en], t) : leitner.demote(t) };
      simStats = statsLib.withAnswer(simStats, known, storage.todayKey(new Date(t)));
      if (!known) q.push(en); // возврат в очередь этой же сессии
    }
    if (guard >= 9000) stuck += 1;
  }
}
const dist = leitner.boxDistribution(progress);
check('очередь всегда сходится (нет вечного цикла)', stuck === 0, stuck);
check('весь словарь открыт за 40 дней', dist.untouched === 0, dist.untouched);
check('слова доходят до ящика 5', dist.boxes[5] > 100, dist.boxes[5]);
check('долг повторений разгребается', leitner.countDue(progress, t) === 0, leitner.countDue(progress, t));
check('сумма по ящикам сходится', dist.boxes.reduce((a, b) => a + b, 0) + dist.untouched === WORDS.length);
check(
  'статистика сошлась с числом ответов',
  simStats.totalRight + simStats.totalWrong > 0 &&
    simStats.totalRight ===
      Object.values(simStats.byDate).reduce((a, d) => a + d.right, 0),
);

/* --- сохранение/чтение и защита от мусора --- */
storage.saveProgress({ away: { box: 9, due: 1 }, bad: null, worse: { box: 'x', due: 2 } });
const cleaned = storage.loadProgress();
check('ящик обрезается до 5', cleaned.away.box === 5);
check('битые записи отброшены', !('bad' in cleaned) && !('worse' in cleaned));

mem.set('vocab-stats', '{не json');
check('битый JSON -> пустая статистика', storage.loadStats().totalRight === 0);

storage.resetAll();
check('после сброса пусто', Object.keys(storage.loadProgress()).length === 0);
check('после сброса импорт не повторяется', storage.seedFromLegacyIfEmpty() === false);

const snap = storage.exportSnapshot();
storage.importSnapshot(snap);
check('экспорт/импорт читается', typeof JSON.parse(snap).progress === 'object');

console.log(failed ? `\n${failed} проверок упало` : '\nвсе проверки прошли');
process.exit(failed ? 1 : 0);
