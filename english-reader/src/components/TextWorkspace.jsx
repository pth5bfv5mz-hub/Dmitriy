import { useCallback, useEffect, useState } from 'react';
import * as library from '../lib/library.js';
import Reader from './Reader.jsx';
import Quiz from './Quiz.jsx';
import Retelling from './Retelling.jsx';
import Chat from './Chat.jsx';

const STEPS = [
  { id: 'read', label: 'Чтение', hint: 'Кликайте слова — появится перевод в контексте' },
  { id: 'quiz', label: 'Тест', hint: 'Вопросы на понимание' },
  { id: 'retell', label: 'Пересказ', hint: 'Перескажите текст своими словами' },
  { id: 'chat', label: 'Диалог', hint: 'Поговорите об этом по-английски' },
];

export default function TextWorkspace({ text, onChange, onBack, onNotify }) {
  const [step, setStep] = useState(text.lastStep ?? 'read');

  // Тексту нужен свежий снимок после каждого действия (словарь, тест, чат).
  const reload = useCallback(() => {
    const fresh = library.getText(text.id);
    if (fresh) onChange(fresh);
  }, [text.id, onChange]);

  const goTo = useCallback(
    (next) => {
      setStep(next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      try {
        library.updateText(text.id, (item) => {
          item.lastStep = next;
        });
      } catch {
        /* не критично: шаг просто не запомнится */
      }
    },
    [text.id],
  );

  // Alt + ←/→ переключают шаги, не мешая обычному вводу текста.
  useEffect(() => {
    function onKey(event) {
      if (!event.altKey) return;
      const index = STEPS.findIndex((item) => item.id === step);
      if (event.key === 'ArrowRight' && index < STEPS.length - 1) goTo(STEPS[index + 1].id);
      if (event.key === 'ArrowLeft' && index > 0) goTo(STEPS[index - 1].id);
      if (event.key === 'ArrowLeft' && index === 0) onBack();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, goTo, onBack]);

  const done = {
    read: Object.keys(text.glossary ?? {}).length > 0 || text.status !== 'new',
    quiz: Boolean(text.quizResult),
    retell: Boolean(text.retelling),
    chat: Boolean(text.chatSummary),
  };

  const current = STEPS.find((item) => item.id === step) ?? STEPS[0];

  return (
    <div className="workspace">
      <nav className="steps" aria-label="Этапы работы с текстом">
        {STEPS.map((item) => (
          <button
            key={item.id}
            className={`step ${item.id === step ? 'active' : ''} ${done[item.id] ? 'done' : ''}`}
            onClick={() => goTo(item.id)}
          >
            {item.label}
            {done[item.id] && <span className="tick">✓</span>}
          </button>
        ))}
      </nav>
      <p className="muted small step-hint">
        {current.hint} <span className="kbd-hint">· Alt + ← / → — переключение</span>
      </p>

      {step === 'read' && (
        <Reader text={text} onNotify={onNotify} onReloaded={reload} onNext={() => goTo('quiz')} />
      )}
      {step === 'quiz' && (
        <Quiz text={text} onNotify={onNotify} onReloaded={reload} onNext={() => goTo('retell')} />
      )}
      {step === 'retell' && (
        <Retelling text={text} onNotify={onNotify} onReloaded={reload} onNext={() => goTo('chat')} />
      )}
      {step === 'chat' && <Chat text={text} onNotify={onNotify} onReloaded={reload} />}
    </div>
  );
}
