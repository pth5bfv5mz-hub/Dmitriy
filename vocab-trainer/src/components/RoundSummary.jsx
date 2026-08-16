import { WORD_BY_EN } from '../data/words.js';
import { accuracy } from '../lib/stats.js';

export default function RoundSummary({ summary, onAgain, onHome }) {
  const { right, wrong, planned, missed } = summary;
  const acc = accuracy(right, wrong);

  return (
    <div className="screen">
      <header className="app-header">
        <h1 className="app-title">Раунд закончен</h1>
        <p className="app-subtitle">
          {planned} {plural(planned, 'карточка', 'карточки', 'карточек')} в раунде
        </p>
      </header>

      <div className="summary-score">
        <div className="summary-big tone-good">{right}</div>
        <div className="summary-sep">/</div>
        <div className="summary-big tone-bad">{wrong}</div>
      </div>
      <p className="summary-caption">
        {acc == null ? 'ответов не было' : `точность раунда ${acc}%`}
      </p>

      {missed.length > 0 && (
        <section className="panel">
          <div className="panel-title">Вернутся раньше остальных</div>
          <ul className="missed-list">
            {missed.map((en) => {
              const w = WORD_BY_EN.get(en) ?? { en, ru: '—' };
              return (
                <li key={en}>
                  <span className="missed-en">{w.en}</span>
                  <span className="missed-ru">{w.ru}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <button className="btn btn-primary btn-hero" onClick={onAgain}>
        Ещё раунд
      </button>
      <button className="btn btn-ghost" onClick={onHome}>
        На главную
      </button>
    </div>
  );
}

function plural(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
