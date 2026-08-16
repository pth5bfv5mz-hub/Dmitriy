import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import * as library from './lib/library.js';
import Library from './components/Library.jsx';
import TextWorkspace from './components/TextWorkspace.jsx';
import Toast from './components/Toast.jsx';

export default function App() {
  const [genres, setGenres] = useState([]);
  const [texts, setTexts] = useState(() => library.listTexts());
  const [current, setCurrent] = useState(null);
  const [health, setHealth] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = useCallback((message, tone = 'error') => setToast({ message, tone }), []);

  const refreshLibrary = useCallback(() => setTexts(library.listTexts()), []);

  useEffect(() => {
    (async () => {
      try {
        setGenres(await api.genres());
      } catch (error) {
        notify(error.message);
      }
      setHealth(await api.health().catch(() => null));
    })();
  }, [notify]);

  const openText = useCallback(
    (id) => {
      const text = library.getText(id);
      if (!text) {
        notify('Текст не найден — возможно, он был удалён.');
        refreshLibrary();
        return;
      }
      setCurrent(text);
      window.scrollTo({ top: 0 });
    },
    [notify, refreshLibrary],
  );

  const closeText = useCallback(() => {
    setCurrent(null);
    refreshLibrary();
  }, [refreshLibrary]);

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={closeText} title="К библиотеке">
          <span className="brand-mark">ER</span>
          <span>English&nbsp;Reader</span>
        </button>
        <div className="topbar-right">
          {current ? (
            <button className="btn ghost" onClick={closeText}>
              ← Библиотека
            </button>
          ) : (
            <span className="muted small">{texts.length} текстов · уровень B1</span>
          )}
        </div>
      </header>

      {health && !health.hasKey && (
        <div className="banner">
          На сервере не задан ключ <code>ANTHROPIC_API_KEY</code> — генерация текстов пока не
          работает. Добавьте ключ в настройках хостинга и перезапустите сервис.
        </div>
      )}

      <main>
        {current ? (
          <TextWorkspace
            key={current.id}
            text={current}
            onChange={setCurrent}
            onBack={closeText}
            onNotify={notify}
          />
        ) : (
          <Library
            genres={genres}
            texts={texts}
            onOpen={openText}
            onRefresh={refreshLibrary}
            onNotify={notify}
          />
        )}
      </main>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
