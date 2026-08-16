import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import Library from './components/Library.jsx';
import TextWorkspace from './components/TextWorkspace.jsx';
import Toast from './components/Toast.jsx';

export default function App() {
  const [genres, setGenres] = useState([]);
  const [texts, setTexts] = useState([]);
  const [current, setCurrent] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const notify = useCallback((message, tone = 'error') => setToast({ message, tone }), []);

  const refreshLibrary = useCallback(async () => {
    try {
      setTexts(await api.listTexts());
    } catch (error) {
      notify(error.message);
    }
  }, [notify]);

  useEffect(() => {
    (async () => {
      try {
        const [genreList, textList, healthInfo] = await Promise.all([
          api.genres(),
          api.listTexts(),
          api.health().catch(() => null),
        ]);
        setGenres(genreList);
        setTexts(textList);
        setHealth(healthInfo);
      } catch (error) {
        notify(error.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [notify]);

  const openText = useCallback(
    async (id) => {
      try {
        setCurrent(await api.getText(id));
        window.scrollTo({ top: 0 });
      } catch (error) {
        notify(error.message);
      }
    },
    [notify],
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
          Не задан <code>ANTHROPIC_API_KEY</code>. Скопируйте <code>.env.example</code> в{' '}
          <code>.env</code>, впишите ключ и перезапустите <code>npm run dev</code>.
        </div>
      )}

      <main>
        {loading ? (
          <div className="center muted">Загрузка…</div>
        ) : current ? (
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
