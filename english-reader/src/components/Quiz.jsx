import { useState } from 'react';
import { api } from '../api.js';

export default function Quiz({ text, onNotify, onReloaded, onNext }) {
  const [answers, setAnswers] = useState(() => text.quizResult?.answers ?? []);
  const [result, setResult] = useState(text.quizResult ?? null);
  const [sending, setSending] = useState(false);

  const allAnswered = text.questions.every((_, index) => Number.isInteger(answers[index]));

  async function submit() {
    if (!allAnswered || sending) return;
    setSending(true);
    try {
      const data = await api.submitQuiz(text.id, answers);
      setResult(data);
      onReloaded?.();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      onNotify(error.message);
    } finally {
      setSending(false);
    }
  }

  function retry() {
    setResult(null);
    setAnswers([]);
  }

  return (
    <section className="quiz">
      <h1 className="section-title big">Часть А. Вопросы по тексту</h1>

      {result && (
        <div className={`quiz-score ${result.correct === result.total ? 'perfect' : ''}`}>
          <b>
            {result.correct} из {result.total}
          </b>
          <span className="muted">
            {result.correct === result.total
              ? ' — идеально, всё понято верно.'
              : result.correct >= result.total - 1
                ? ' — почти всё верно.'
                : ' — стоит перечитать текст ещё раз.'}
          </span>
        </div>
      )}

      <ol className="questions">
        {text.questions.map((question, qIndex) => {
          const detail = result?.details?.[qIndex];
          return (
            <li key={qIndex} className="question card">
              <p className="question-text">{question.question}</p>
              <div className="options">
                {question.options.map((option, oIndex) => {
                  const chosen = answers[qIndex] === oIndex;
                  let tone = '';
                  if (detail) {
                    if (oIndex === detail.correctIndex) tone = 'correct';
                    else if (chosen) tone = 'wrong';
                  }
                  return (
                    <button
                      key={oIndex}
                      className={`option ${chosen ? 'chosen' : ''} ${tone}`}
                      disabled={Boolean(result)}
                      onClick={() =>
                        setAnswers((prev) => {
                          const next = [...prev];
                          next[qIndex] = oIndex;
                          return next;
                        })
                      }
                    >
                      <span className="option-letter">{'ABCD'[oIndex] ?? oIndex + 1}</span>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>
              {detail && question.explanation && (
                <p className={`explanation ${detail.isCorrect ? 'good' : 'bad'}`}>
                  {detail.isCorrect ? '✓ ' : '✗ '}
                  {question.explanation}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <div className="actions">
        {!result ? (
          <button className="btn primary" onClick={submit} disabled={!allAnswered || sending}>
            {sending ? 'Проверяю…' : 'Проверить ответы'}
          </button>
        ) : (
          <>
            <button className="btn ghost" onClick={retry}>
              Пройти заново
            </button>
            <button className="btn primary" onClick={onNext}>
              Дальше: пересказ →
            </button>
          </>
        )}
      </div>
    </section>
  );
}
