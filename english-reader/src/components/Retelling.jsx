import { useState } from 'react';
import { api } from '../api.js';
import { advanceStatus, updateText } from '../lib/library.js';

export default function Retelling({ text, onNotify, onReloaded, onNext }) {
  const [draft, setDraft] = useState(text.retelling?.text ?? '');
  const [feedback, setFeedback] = useState(text.retelling?.feedback ?? null);
  const [sending, setSending] = useState(false);

  const words = draft.trim().split(/\s+/).filter(Boolean).length;

  async function submit() {
    if (sending || words < 10) return;
    setSending(true);
    try {
      const result = await api.checkRetelling({
        title: text.title,
        text: text.paragraphs.join('\n\n'),
        retelling: draft,
      });
      updateText(text.id, (item) => {
        item.retelling = { text: draft, feedback: result, at: new Date().toISOString() };
        item.lastStep = 'retell';
        advanceStatus(item, 'quiz_done');
      });
      setFeedback(result);
      onReloaded?.();
    } catch (error) {
      onNotify(error.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="retell">
      <h1 className="section-title big">Часть Б. Перескажите своими словами</h1>
      <p className="muted">
        Напишите по-английски, о чём был текст: 3–6 предложений. Не старайтесь вспомнить точные
        слова — важно передать смысл.
      </p>

      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        rows={8}
        placeholder="The story is about..."
        spellCheck="false"
      />
      <div className="retell-meta">
        <span className="muted small">{words} слов</span>
        <button className="btn primary" onClick={submit} disabled={sending || words < 10}>
          {sending ? 'Проверяю…' : feedback ? 'Проверить ещё раз' : 'Отправить на проверку'}
        </button>
      </div>

      {feedback && (
        <div className="feedback card">
          <div className="feedback-head">
            <span className="score">{feedback.score}/10</span>
            <span>{feedback.verdict}</span>
          </div>

          {feedback.praise && <p className="praise">👏 {feedback.praise}</p>}

          {feedback.understood?.length > 0 && (
            <div className="feedback-block">
              <h3>Понято верно</h3>
              <ul className="ticks">
                {feedback.understood.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {feedback.missed?.length > 0 && (
            <div className="feedback-block">
              <h3>Упущено</h3>
              <ul className="dots">
                {feedback.missed.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {feedback.language?.length > 0 && (
            <div className="feedback-block">
              <h3>Язык</h3>
              <ul className="corrections">
                {feedback.language.map((item, index) => (
                  <li key={index}>
                    <span className="was">{item.quote}</span>
                    <span className="arrow">→</span>
                    <span className="now">{item.correction}</span>
                    {item.comment && <span className="muted small block">{item.comment}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="actions">
            <button className="btn primary" onClick={onNext}>
              Дальше: разговор об этом →
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
