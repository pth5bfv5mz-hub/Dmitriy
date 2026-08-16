import { useMemo, useState } from 'react';
import { api } from '../api.js';
import { STATUS_LABELS, formatDate } from '../lib/text.js';

const SURPRISE = { id: 'surprise', label: 'Удиви меня', emoji: '🎲', description: 'Жанр и тему выберет ИИ' };

export default function Library({ genres, texts, onOpen, onRefresh, onNotify }) {
  const [genreId, setGenreId] = useState('surprise');
  const [topic, setTopic] = useState('');
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const selected = genres.find((genre) => genre.id === genreId) ?? SURPRISE;
  const options = [SURPRISE, ...genres];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return texts.filter((text) => {
      if (filter !== 'all' && text.genre?.id !== filter) return false;
      if (!q) return true;
      return `${text.title} ${text.topic}`.toLowerCase().includes(q);
    });
  }, [texts, filter, query]);

  const inProgress = texts.filter((text) => text.status === 'reading' || text.status === 'quiz_done');

  async function create(event) {
    event?.preventDefault();
    if (creating) return;
    setCreating(true);
    try {
      const text = await api.createText({ genre: genreId, topic });
      setTopic('');
      await onRefresh();
      onOpen(text.id);
    } catch (error) {
      onNotify(error.message);
    } finally {
      setCreating(false);
    }
  }

  async function remove(event, id) {
    event.stopPropagation();
    if (!window.confirm('Удалить текст вместе с прогрессом?')) return;
    try {
      await api.deleteText(id);
      onRefresh();
    } catch (error) {
      onNotify(error.message);
    }
  }

  return (
    <div className="library">
      <section className="generator card">
        <h1>Новый текст</h1>
        <p className="muted">
          Короткая история или эссе на 200–350 слов, уровень B1: со словарём по клику, тестом,
          пересказом и разговором.
        </p>

        <div className="genre-grid">
          {options.map((genre) => (
            <button
              key={genre.id}
              type="button"
              className={`genre-chip ${genre.id === genreId ? 'active' : ''}`}
              onClick={() => setGenreId(genre.id)}
              title={genre.description}
            >
              <span className="genre-emoji">{genre.emoji}</span>
              <span className="genre-label">{genre.label}</span>
            </button>
          ))}
        </div>
        <p className="muted small genre-hint">{selected.description}</p>

        <form className="topic-row" onSubmit={create}>
          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="Тема (по-русски или по-английски) — или оставьте пустым для случайной"
            aria-label="Тема текста"
          />
          <button className="btn primary" disabled={creating}>
            {creating ? 'Пишу…' : 'Новый текст'}
          </button>
        </form>

        {selected.topics?.length > 0 && (
          <div className="suggestions">
            <span className="muted small">Идеи:</span>
            {selected.topics.slice(0, 4).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="suggestion"
                onClick={() => setTopic(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {creating && (
          <p className="muted small pulse">
            Генерация занимает 15–30 секунд: текст + вопросы к нему.
          </p>
        )}
      </section>

      {inProgress.length > 0 && (
        <section className="continue">
          <h2 className="section-title">Продолжить</h2>
          <div className="continue-row">
            {inProgress.slice(0, 3).map((text) => (
              <button key={text.id} className="continue-card" onClick={() => onOpen(text.id)}>
                <span className="genre-emoji">{text.genre?.emoji ?? '📖'}</span>
                <span>
                  <strong>{text.title}</strong>
                  <span className="muted small block">{STATUS_LABELS[text.status]?.label}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="library-head">
          <h2 className="section-title">Библиотека</h2>
          <div className="library-tools">
            <input
              className="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск по названию"
              aria-label="Поиск"
            />
            <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Фильтр по жанру">
              <option value="all">Все жанры</option>
              {genres.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.emoji} {genre.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="muted empty">
            {texts.length === 0
              ? 'Пока пусто. Выберите жанр выше и создайте первый текст.'
              : 'Ничего не найдено по этому фильтру.'}
          </p>
        ) : (
          <ul className="text-list">
            {visible.map((text) => {
              const status = STATUS_LABELS[text.status] ?? STATUS_LABELS.new;
              return (
                <li key={text.id}>
                  <button className="text-card" onClick={() => onOpen(text.id)}>
                    <span className="genre-emoji big">{text.genre?.emoji ?? '📖'}</span>
                    <span className="text-card-body">
                      <span className="text-card-title">{text.title}</span>
                      <span className="muted small">
                        {text.genre?.label ?? '—'} · {text.wordCount} слов · {formatDate(text.createdAt)}
                      </span>
                      <span className="text-card-meta">
                        <span className={`badge ${status.tone}`}>{status.label}</span>
                        {text.quiz && (
                          <span className="badge quiet">
                            тест {text.quiz.correct}/{text.quiz.total}
                          </span>
                        )}
                        {text.lookedUpWords > 0 && (
                          <span className="badge quiet">слов: {text.lookedUpWords}</span>
                        )}
                      </span>
                    </span>
                    <span
                      className="delete"
                      role="button"
                      tabIndex={0}
                      title="Удалить"
                      onClick={(event) => remove(event, text.id)}
                      onKeyDown={(event) => event.key === 'Enter' && remove(event, text.id)}
                    >
                      ×
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
