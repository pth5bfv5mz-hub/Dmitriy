import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { splitSentences, tokenize } from '../lib/text.js';

/** Ключ должен совпадать с серверным, чтобы переиспользовать кэш переводов. */
const glossaryKey = (word, sentence) =>
  `${word.toLowerCase()}::${sentence.slice(0, 60).toLowerCase()}`;

export default function Reader({ text, onNotify, onReloaded, onNext }) {
  const [cache, setCache] = useState(() => ({ ...(text.glossary ?? {}) }));
  const [popup, setPopup] = useState(null); // { key, word, rect }
  const [loadingKey, setLoadingKey] = useState(null);
  const popupRef = useRef(null);

  const seenWords = useMemo(
    () => new Set(Object.keys(cache).map((key) => key.split('::')[0])),
    [cache],
  );

  const paragraphs = useMemo(
    () => text.paragraphs.map((paragraph) => splitSentences(paragraph).map((sentence) => ({ sentence, tokens: tokenize(sentence) }))),
    [text.paragraphs],
  );

  const close = useCallback(() => setPopup(null), []);

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') close();
    }
    function onClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target) && !event.target.closest('.word')) {
        close();
      }
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClickOutside);
    // Позиция подсказки привязана к экрану, поэтому при прокрутке её проще закрыть.
    window.addEventListener('scroll', close, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('scroll', close);
    };
  }, [close]);

  async function lookup(event, word, sentence) {
    const key = glossaryKey(word, sentence);
    const rect = event.currentTarget.getBoundingClientRect();
    setPopup({ key, word, rect });

    if (cache[key]) return;

    setLoadingKey(key);
    try {
      const entry = await api.translate(text.id, { word, sentence });
      setCache((prev) => ({ ...prev, [key]: entry }));
      onReloaded?.();
    } catch (error) {
      onNotify(error.message);
      setPopup(null);
    } finally {
      setLoadingKey(null);
    }
  }

  const lookedUp = Object.entries(cache);

  return (
    <article className="reader">
      <header className="reader-head">
        <div className="reader-genre">
          <span className="genre-emoji big">{text.genre?.emoji ?? '📖'}</span>
          <span className="muted small">
            {text.genre?.label} · {text.paragraphs.join(' ').split(/\s+/).length} слов
          </span>
        </div>
        <h1 className="reader-title">{text.title}</h1>
        <p className="muted small reader-topic">{text.topic}</p>
      </header>

      <div className="prose">
        {paragraphs.map((sentences, pIndex) => (
          <p key={pIndex}>
            {sentences.map(({ sentence, tokens }, sIndex) =>
              tokens.map((token, tIndex) => {
                const tokenKey = `${pIndex}-${sIndex}-${tIndex}`;
                if (token.type === 'plain' || !token.clickable) {
                  return <span key={tokenKey}>{token.value}</span>;
                }
                const key = glossaryKey(token.value, sentence);
                const isSeen = seenWords.has(token.value.toLowerCase()) || Boolean(cache[key]);
                return (
                  <span
                    key={tokenKey}
                    className={`word ${isSeen ? 'seen' : ''} ${popup?.key === key ? 'active' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={(event) => lookup(event, token.value, sentence)}
                    onKeyDown={(event) => event.key === 'Enter' && lookup(event, token.value, sentence)}
                  >
                    {token.value}
                  </span>
                );
              }),
            )}
          </p>
        ))}
      </div>

      {popup && (
        <WordPopup
          ref={popupRef}
          rect={popup.rect}
          word={popup.word}
          entry={cache[popup.key]}
          loading={loadingKey === popup.key}
          onClose={close}
        />
      )}

      {lookedUp.length > 0 && (
        <section className="wordlist card">
          <h2 className="section-title">Ваши слова ({lookedUp.length})</h2>
          <ul>
            {lookedUp.map(([key, entry]) => (
              <li key={key}>
                <b>{entry.lemma || entry.word}</b>
                <span className="muted"> — {entry.translation}</span>
                {entry.pos && <span className="muted small"> · {entry.pos}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="actions">
        <button className="btn primary" onClick={onNext}>
          Дальше: тест на понимание →
        </button>
      </div>
    </article>
  );
}

const WordPopup = forwardRef(function WordPopup({ rect, word, entry, loading, onClose }, ref) {
  const width = 260;
  const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, 12), window.innerWidth - width - 12);
  const showBelow = rect.top < 180;
  const style = showBelow
    ? { top: rect.bottom + 10, left, width }
    : { top: rect.top - 10, left, width, transform: 'translateY(-100%)' };

  return (
    <div className="popup" style={style} ref={ref}>
      <div className="popup-head">
        <b>{word}</b>
        <button className="popup-close" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
      </div>
      {loading && <div className="muted small">Перевожу…</div>}
      {!loading && entry && (
        <>
          <div className="popup-translation">{entry.translation}</div>
          <div className="muted small">
            {entry.lemma && entry.lemma.toLowerCase() !== word.toLowerCase() && <>{entry.lemma} · </>}
            {entry.pos}
          </div>
          {entry.note && <div className="popup-note">{entry.note}</div>}
        </>
      )}
    </div>
  );
});
