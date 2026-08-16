import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { advanceStatus, updateText } from '../lib/library.js';

export default function Chat({ text, onNotify, onReloaded }) {
  const [turns, setTurns] = useState(() => (text.chat ?? []).filter((turn) => !turn.hidden));
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState(text.chatSummary ?? null);
  const endRef = useRef(null);
  const started = useRef(false);

  const userTurns = turns.filter((turn) => turn.role === 'user').length;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns, busy]);

  // Первый ход делает ИИ — чтобы пользователю было с чего начать.
  useEffect(() => {
    if (started.current || turns.length > 0) return;
    started.current = true;
    send('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send(message) {
    if (busy) return;
    setBusy(true);

    const history = turns.map(({ role, content }) => ({ role, content }));
    if (message) {
      setTurns((prev) => [...prev, { role: 'user', content: message, at: new Date().toISOString() }]);
      setDraft('');
    }

    try {
      const data = await api.chat({
        title: text.title,
        text: text.paragraphs.join('\n\n'),
        genre: text.genre?.label ?? '',
        history,
        message,
      });

      const now = new Date().toISOString();
      const added = [];
      if (message) added.push({ role: 'user', content: message, at: now });
      added.push({ role: 'assistant', content: data.reply, at: now });

      setTurns((prev) => [...prev, { role: 'assistant', content: data.reply, at: now }]);
      updateText(text.id, (item) => {
        item.chat = [...(item.chat ?? []), ...added];
        item.lastStep = 'chat';
        advanceStatus(item, 'quiz_done');
      });
      onReloaded?.();
    } catch (error) {
      onNotify(error.message);
      // Реплику, которая не дошла, из переписки убираем — иначе она застрянет без ответа.
      if (message) {
        setTurns((prev) => prev.filter((turn, index) => !(index === prev.length - 1 && turn.role === 'user')));
        setDraft(message);
      }
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await api.chatSummary({
        title: text.title,
        history: turns.map(({ role, content }) => ({ role, content })),
      });
      updateText(text.id, (item) => {
        item.chatSummary = { ...result, at: new Date().toISOString() };
        advanceStatus(item, 'chat_done');
      });
      setSummary(result);
      onReloaded?.();
    } catch (error) {
      onNotify(error.message);
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(event) {
    // Enter отправляет, Shift+Enter — перенос строки.
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (draft.trim()) send(draft.trim());
    }
  }

  return (
    <section className="chat">
      <h1 className="section-title big">Разговор о тексте</h1>
      <p className="muted">
        Отвечайте по-английски, как получается — собеседник поправит явные ошибки коротко и по ходу
        разговора.
      </p>

      <div className="messages">
        {turns.map((turn, index) => (
          <div key={index} className={`bubble ${turn.role}`}>
            {turn.content}
          </div>
        ))}
        {busy && !summary && <div className="bubble assistant typing">…</div>}
        <div ref={endRef} />
      </div>

      <div className="composer">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
          placeholder="Your answer in English… (Enter — отправить, Shift+Enter — новая строка)"
          spellCheck="false"
        />
        <button className="btn primary" onClick={() => draft.trim() && send(draft.trim())} disabled={busy || !draft.trim()}>
          Отправить
        </button>
      </div>

      <div className="actions">
        <button className="btn ghost" onClick={finish} disabled={busy || userTurns < 2}>
          Завершить и получить итоги
        </button>
        {userTurns < 2 && <span className="muted small">Нужно хотя бы две ваши реплики</span>}
      </div>

      {summary && (
        <div className="feedback card">
          <h2 className="section-title">Итоги разговора</h2>

          {summary.good?.length > 0 && (
            <div className="feedback-block">
              <h3>Получилось хорошо</h3>
              <ul className="ticks">
                {summary.good.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {summary.improve?.length > 0 && (
            <div className="feedback-block">
              <h3>Что подтянуть</h3>
              <ul className="dots">
                {summary.improve.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {summary.words?.length > 0 && (
            <div className="feedback-block">
              <h3>Слова на повторение</h3>
              <ul className="wordchips">
                {summary.words.map((item, index) => (
                  <li key={index}>
                    <b>{item.en}</b> — <span className="muted">{item.ru}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.closing && <p className="praise">{summary.closing}</p>}
        </div>
      )}
    </section>
  );
}
