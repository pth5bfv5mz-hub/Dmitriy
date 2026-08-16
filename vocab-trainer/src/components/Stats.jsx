import { useMemo, useState } from 'react';
import { BoxBars } from './Home.jsx';
import { boxDistribution } from '../lib/leitner.js';
import { accuracy, lastDays } from '../lib/stats.js';
import { exportSnapshot, importSnapshot, resetAll } from '../lib/storage.js';

export default function Stats({ progress, stats, onBack, onDataChanged }) {
  const dist = useMemo(() => boxDistribution(progress), [progress]);
  const days = useMemo(() => lastDays(stats, 7), [stats]);
  const maxDay = Math.max(1, ...days.map((d) => d.total));
  const acc = accuracy(stats.totalRight, stats.totalWrong);
  const [tools, setTools] = useState(false);
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState('');

  const handleImport = () => {
    try {
      importSnapshot(importText);
      onDataChanged();
      setImportText('');
      setMessage('Данные загружены.');
    } catch {
      setMessage('Не получилось прочитать JSON.');
    }
  };

  const handleReset = () => {
    if (!window.confirm('Стереть весь прогресс и статистику? Отменить будет нельзя.')) return;
    resetAll();
    onDataChanged();
    setMessage('Прогресс сброшен.');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportSnapshot());
      setMessage('Скопировано в буфер обмена.');
    } catch {
      setMessage('Скопируй текст ниже вручную.');
    }
  };

  return (
    <div className="screen">
      <header className="app-header">
        <button className="link-btn link-back" onClick={onBack}>
          ← Назад
        </button>
        <h1 className="app-title">Статистика</h1>
      </header>

      <section className="panel">
        <div className="panel-title">Активность за 7 дней</div>
        <div className="chart">
          {days.map((d) => (
            <div className={`chart-col ${d.isToday ? 'chart-col-today' : ''}`} key={d.key}>
              <div className="chart-bar-wrap">
                <div
                  className={`chart-bar ${d.total === 0 ? 'chart-bar-empty' : ''}`}
                  style={{ height: `${(d.total / maxDay) * 100}%` }}
                >
                  <div
                    className="chart-bar-right"
                    style={{ height: d.total ? `${(d.right / d.total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
              <div className="chart-total">{d.total || ''}</div>
              <div className="chart-label">{d.label}</div>
            </div>
          ))}
        </div>
        <div className="legend">
          <span className="legend-dot legend-right" /> знал
          <span className="legend-dot legend-wrong" /> не знал
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">За всё время</div>
        <div className="stat-row">
          <div className="stat">
            <div className="stat-value">{stats.totalSessions}</div>
            <div className="stat-label">раундов</div>
          </div>
          <div className="stat">
            <div className="stat-value tone-good">{stats.totalRight}</div>
            <div className="stat-label">знал</div>
          </div>
          <div className="stat">
            <div className="stat-value tone-bad">{stats.totalWrong}</div>
            <div className="stat-label">не знал</div>
          </div>
          <div className="stat">
            <div className="stat-value">{acc == null ? '—' : `${acc}%`}</div>
            <div className="stat-label">точность</div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">Распределение по ящикам</div>
        <BoxBars dist={dist} />
        <p className="panel-note">
          Выучено (ящик 5): {dist.boxes[5]} · в работе: {dist.total - dist.untouched} ·
          осталось открыть: {dist.untouched}
        </p>
      </section>

      <button className="btn btn-ghost" onClick={() => setTools((v) => !v)}>
        {tools ? 'Скрыть управление данными' : 'Управление данными'}
      </button>

      {tools && (
        <section className="panel">
          <div className="panel-title">Резервная копия</div>
          <p className="panel-note">
            Прогресс лежит в этом браузере. Перед сменой телефона или очисткой данных
            скопируй JSON и вставь его на новом устройстве.
          </p>
          <div className="tool-row">
            <button className="btn btn-small" onClick={handleCopy}>
              Копировать прогресс
            </button>
            <button className="btn btn-small btn-danger" onClick={handleReset}>
              Сбросить всё
            </button>
          </div>
          <textarea
            className="tool-text"
            readOnly
            value={exportSnapshot()}
            onFocus={(e) => e.target.select()}
            rows={4}
          />
          <div className="panel-title">Загрузить из копии</div>
          <textarea
            className="tool-text"
            placeholder="Вставь сюда JSON"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={3}
          />
          <button className="btn btn-small" onClick={handleImport} disabled={!importText.trim()}>
            Загрузить
          </button>
          {message && <p className="notice">{message}</p>}
        </section>
      )}
    </div>
  );
}
