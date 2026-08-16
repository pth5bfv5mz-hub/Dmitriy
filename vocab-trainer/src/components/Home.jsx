import { useMemo } from 'react';
import { WORDS } from '../data/words.js';
import { boxDistribution, boxLabel, countDue, newWordsAllowed } from '../lib/leitner.js';
import { accuracy, dayStat } from '../lib/stats.js';

export default function Home({
  progress,
  stats,
  direction,
  seeded,
  persistent,
  onDirectionChange,
  onStart,
  onStats,
}) {
  const due = useMemo(() => countDue(progress), [progress]);
  const dist = useMemo(() => boxDistribution(progress), [progress]);
  const today = dayStat(stats);
  const todayTotal = today.right + today.wrong;
  const todayAcc = accuracy(today.right, today.wrong);
  const started = dist.total - dist.untouched;
  const fresh = Math.min(newWordsAllowed(due), dist.untouched);

  return (
    <div className="screen">
      <header className="app-header">
        <h1 className="app-title">Слова</h1>
        <p className="app-subtitle">
          {started} из {WORDS.length} слов в работе
        </p>
      </header>

      {!persistent && (
        <p className="notice notice-warn">
          Браузер не даёт сохранять данные (приватный режим?). Прогресс этой сессии
          не сохранится.
        </p>
      )}
      {seeded && <p className="notice">Прогресс из прошлой версии перенесён.</p>}

      <button className="btn btn-primary btn-hero" onClick={onStart}>
        {todayTotal > 0 ? 'Ещё раунд' : 'Начать раунд'}
        <span className="btn-hint">
          {due > 0 ? `${due} на повторение` : 'повторять пока нечего'}
          {fresh > 0 && ` · +${fresh} новых`}
          {fresh === 0 && dist.untouched > 0 && ' · новые после повторений'}
        </span>
      </button>

      <section className="panel">
        <div className="panel-title">Направление</div>
        <div className="segmented">
          <button
            className={`seg ${direction === 'en-ru' ? 'seg-active' : ''}`}
            onClick={() => onDirectionChange('en-ru')}
          >
            EN → RU
          </button>
          <button
            className={`seg ${direction === 'ru-en' ? 'seg-active' : ''}`}
            onClick={() => onDirectionChange('ru-en')}
          >
            RU → EN
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">Сегодня</div>
        <div className="stat-row">
          <Stat value={today.sessions} label="раундов" />
          <Stat value={today.right} label="знал" tone="good" />
          <Stat value={today.wrong} label="не знал" tone="bad" />
          <Stat value={todayAcc == null ? '—' : `${todayAcc}%`} label="точность" />
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">Ящики</div>
        <BoxBars dist={dist} />
      </section>

      <button className="btn btn-ghost" onClick={onStats}>
        Вся статистика
      </button>
    </div>
  );
}

function Stat({ value, label, tone }) {
  return (
    <div className="stat">
      <div className={`stat-value ${tone ? `tone-${tone}` : ''}`}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export function BoxBars({ dist }) {
  const max = Math.max(1, ...dist.boxes, dist.untouched);
  return (
    <div className="boxes">
      {dist.boxes.map((count, box) => (
        <div className="box-row" key={box}>
          <div className="box-name">
            {box}
            <span className="box-interval">{boxLabel(box)}</span>
          </div>
          <div className="box-track">
            <div
              className={`box-fill box-fill-${box}`}
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <div className="box-count">{count}</div>
        </div>
      ))}
      <div className="box-row box-row-muted">
        <div className="box-name">
          —<span className="box-interval">не начато</span>
        </div>
        <div className="box-track">
          <div className="box-fill box-fill-none" style={{ width: `${(dist.untouched / max) * 100}%` }} />
        </div>
        <div className="box-count">{dist.untouched}</div>
      </div>
    </div>
  );
}
