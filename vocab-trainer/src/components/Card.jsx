import { WORD_BY_EN } from '../data/words.js';

export default function Card({
  en,
  direction,
  revealed,
  position,
  total,
  right,
  wrong,
  onReveal,
  onAnswer,
  onQuit,
}) {
  const word = WORD_BY_EN.get(en) ?? { en, ru: '—' };
  const front = direction === 'en-ru' ? word.en : word.ru;
  const back = direction === 'en-ru' ? word.ru : word.en;
  const frontLang = direction === 'en-ru' ? 'en' : 'ru';

  return (
    <div className="screen screen-card">
      <div className="card-top">
        <button className="link-btn" onClick={onQuit}>
          Закончить
        </button>
        <div className="card-counter">
          {position} / {total}
        </div>
        <div className="card-score">
          <span className="tone-good">{right}</span>
          <span className="card-score-sep">·</span>
          <span className="tone-bad">{wrong}</span>
        </div>
      </div>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${(Math.max(0, position - 1) / total) * 100}%` }}
        />
      </div>

      <button
        type="button"
        className={`card ${revealed ? 'card-open' : ''}`}
        onClick={revealed ? undefined : onReveal}
        aria-label={revealed ? undefined : 'Показать перевод'}
      >
        <div className={`card-front lang-${frontLang}`}>{front}</div>
        {word.tr && frontLang === 'en' && <div className="card-tr">[{word.tr}]</div>}

        {revealed ? (
          <>
            <div className="card-divider" />
            <div className={`card-back lang-${frontLang === 'en' ? 'ru' : 'en'}`}>{back}</div>
            {word.tr && frontLang === 'ru' && <div className="card-tr">[{word.tr}]</div>}
          </>
        ) : (
          <div className="card-tap">нажми, чтобы увидеть перевод</div>
        )}
      </button>

      <div className="card-actions">
        {revealed ? (
          <>
            <button className="btn btn-bad" onClick={() => onAnswer(false)}>
              Не знал
            </button>
            <button className="btn btn-good" onClick={() => onAnswer(true)}>
              Знал
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={onReveal}>
            Показать перевод
          </button>
        )}
      </div>
    </div>
  );
}
