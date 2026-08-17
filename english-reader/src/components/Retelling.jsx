import { useState } from 'react';
import { api } from '../api.js';
import { advanceStatus, updateText } from '../lib/library.js';
import { getKey } from '../lib/anthropic.js';
import { stripEmphasis } from '../lib/text.js';

export default function Retelling({ text, onNotify, onReloaded, onNext }) {
  const [draft, setDraft] = useState(text.retelling?.text ?? text.selfCheck?.text ?? '');
  const [feedback, setFeedback] = useState(text.retelling?.feedback ?? null);
  const [revealed, setRevealed] = useState(Boolean(text.selfCheck?.revealed));
  const [sending, setSending] = useState(false);

  // Без ключа проверить пересказ ИИ не может — тогда работает самопроверка
  // по ключевым мыслям и образцу, они записаны в самом тексте.
  const aiAvailable = Boolean(getKey()) || !text.builtIn;
  const canSelfCheck = Array.isArray(text.keyPoints) && text.keyPoints.length > 0;

  const words = draft.trim().split(/\s+/).filter(Boolean).length;

  async function submit() {
    if (sending || words < 10) return;
    setSending(true);
    try {
      const result = await api.checkRetelling({
        title: text.title,
        text: stripEmphasis(text.paragraphs.join('\n\n')),
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

  function reveal() {
    setRevealed(true);
    updateText(text.id, (item) => {
      item.selfCheck = { text: draft, revealed: true, at: new Date().toISOString() };
      item.lastStep = 'retell';
      advanceStatus(item, 'quiz_done');
    });
    onReloaded?.();
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
        {aiAvailable ? (
          <button className="btn primary" onClick={submit} disabled={sending || words < 10}>
            {sending ? 'Проверяю…' : feedback ? 'Проверить ещё раз' : 'Отправить на проверку'}
          </button>
        ) : (
          canSelfCheck && (
            <button className="btn primary" onClick={reveal} disabled={words < 10}>
              {revealed ? 'Показать разбор снова' : 'Проверить себя'}
            </button>
          )
        )}
      </div>

      {!aiAvailable && !revealed && canSelfCheck && (
        <p className="muted small">
          Сначала напишите свой пересказ, а потом откройте разбор: так проверка честнее.
        </p>
      )}

      {!aiAvailable && revealed && (
        <div className="feedback card">
          <div className="feedback-block">
            <h3>Что стоило упомянуть</h3>
            <ul className="ticks">
              {text.keyPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
            <p className="muted small">
              Сравните со своим пересказом: каждая мысль, которую вы передали, — плюс. Пропущенное
              не ошибка, а подсказка, что перечитать.
            </p>
          </div>

          {text.modelRetelling && (
            <div className="feedback-block">
              <h3>Образец пересказа</h3>
              <p className="model-retelling">{text.modelRetelling}</p>
              <p className="muted small">
                Это один из возможных вариантов, а не единственно верный. Посмотрите, какими словами
                и временами он пользуется.
              </p>
            </div>
          )}

          <div className="actions">
            <button className="btn primary" onClick={onNext}>
              Дальше: разговор об этом →
            </button>
          </div>
        </div>
      )}

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
