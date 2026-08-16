import { useState } from 'react';
import { getKey, looksLikeKey, setKey } from '../lib/anthropic.js';

/**
 * Экран ввода ключа Anthropic. Появляется только в режиме без сервера:
 * ключ остаётся в этом браузере и отправляется исключительно в Anthropic.
 */
export default function KeyGate({ onSaved, onCancel }) {
  const [value, setValue] = useState(getKey());
  const [error, setError] = useState('');

  function save(event) {
    event.preventDefault();
    const key = value.trim();

    if (!key) {
      setError('Вставьте ключ — без него ИИ не сможет писать тексты.');
      return;
    }
    if (!looksLikeKey(key)) {
      setError('Похоже, это не ключ Anthropic: он начинается с sk-ant- и довольно длинный.');
      return;
    }

    setKey(key);
    onSaved();
  }

  function forget() {
    setKey('');
    setValue('');
    setError('');
    onSaved();
  }

  return (
    <section className="keygate card">
      <h1>Нужен ключ Anthropic</h1>
      <p className="muted">
        Тексты, переводы и разговор пишет ИИ Claude. Чтобы он отвечал, нужен ваш личный ключ —
        это как пароль от вашего счёта у Anthropic.
      </p>

      <ol className="steps-list">
        <li>
          Откройте{' '}
          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">
            console.anthropic.com
          </a>{' '}
          и войдите.
        </li>
        <li>
          Раздел <b>API Keys</b> → кнопка <b>Create Key</b> → скопируйте строку (она показывается
          один раз).
        </li>
        <li>
          В разделе <b>Billing</b> пополните счёт хотя бы на 5 долларов — иначе ИИ отвечать не
          будет. Один текст с тестом и разговором стоит около 2–4 центов.
        </li>
        <li>Вставьте ключ сюда и нажмите «Сохранить».</li>
      </ol>

      <form onSubmit={save} className="keygate-form">
        <input
          type="password"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError('');
          }}
          placeholder="sk-ant-..."
          autoComplete="off"
          spellCheck="false"
          aria-label="Ключ Anthropic"
        />
        <button className="btn primary">Сохранить</button>
      </form>

      {error && <p className="keygate-error">{error}</p>}

      <p className="muted small">
        Ключ хранится только в этом браузере, на этом устройстве. Он не попадает ни в интернет-адрес
        сайта, ни к автору приложения — уходит напрямую в Anthropic. Если решите его отозвать,
        удалите ключ на console.anthropic.com, и он сразу перестанет работать.
      </p>

      <div className="actions">
        {getKey() && (
          <button type="button" className="btn ghost" onClick={forget}>
            Удалить ключ из браузера
          </button>
        )}
        {onCancel && (
          <button type="button" className="btn ghost" onClick={onCancel}>
            Назад
          </button>
        )}
      </div>
    </section>
  );
}
