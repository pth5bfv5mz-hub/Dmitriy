import { useCallback, useEffect, useMemo, useState } from 'react';
import Home from './components/Home.jsx';
import Card from './components/Card.jsx';
import RoundSummary from './components/RoundSummary.jsx';
import Stats from './components/Stats.jsx';
import { buildRound, demote, promote } from './lib/leitner.js';
import {
  PROGRESS_KEY,
  STATS_KEY,
  isPersistent,
  loadProgress,
  loadSettings,
  loadStats,
  saveProgress,
  saveSettings,
  saveStats,
  seedFromLegacyIfEmpty,
} from './lib/storage.js';
import { withAnswer, withSessionStart } from './lib/stats.js';

/** Куда вставлять слово, на которое ответили «не знал», чтобы оно всплыло не сразу. */
const REPEAT_GAP = 3;

/** Разовый импорт старого прогресса. На уровне модуля — чтобы выполниться
 *  ровно один раз, до первого чтения хранилища и независимо от StrictMode. */
const SEEDED = seedFromLegacyIfEmpty();

export default function App() {
  const [progress, setProgress] = useState(loadProgress);
  const [stats, setStats] = useState(loadStats);
  const [settings, setSettings] = useState(loadSettings);
  const [screen, setScreen] = useState('home');
  const [round, setRound] = useState(null);
  const [summary, setSummary] = useState(null);
  const persistent = useMemo(() => isPersistent(), []);

  // Прогресс мог измениться в другой вкладке — подхватываем.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === PROGRESS_KEY) setProgress(loadProgress());
      if (e.key === STATS_KEY) setStats(loadStats());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setDirection = useCallback(
    (direction) => {
      const next = { ...settings, direction };
      saveSettings(next);
      setSettings(next);
    },
    [settings],
  );

  const startRound = useCallback(() => {
    const { queue, counts } = buildRound(progress);
    if (queue.length === 0) return;

    const nextStats = withSessionStart(stats);
    saveStats(nextStats);
    setStats(nextStats);

    setSummary(null);
    setRound({
      queue,
      pos: 0,
      revealed: false,
      right: 0,
      wrong: 0,
      planned: queue.length,
      counts,
      missed: [],
    });
    setScreen('card');
  }, [progress, stats]);

  const reveal = useCallback(() => {
    setRound((r) => (r && !r.revealed ? { ...r, revealed: true } : r));
  }, []);

  const finish = useCallback((r) => {
    setSummary({ right: r.right, wrong: r.wrong, planned: r.planned, missed: r.missed });
    setRound(null);
    setScreen('summary');
  }, []);

  const answer = useCallback(
    (known) => {
      if (!round || !round.revealed) return;
      const en = round.queue[round.pos];
      const now = Date.now();

      // Пишем сразу, синхронно — данные лёгкие, дебаунс не нужен.
      const nextProgress = { ...progress, [en]: known ? promote(progress[en], now) : demote(now) };
      saveProgress(nextProgress);
      setProgress(nextProgress);

      const nextStats = withAnswer(stats, known);
      saveStats(nextStats);
      setStats(nextStats);

      const queue = round.queue.slice();
      if (!known) {
        // Слово возвращается в очередь этой же сессии — но не следующим же экраном.
        queue.splice(Math.min(queue.length, round.pos + 1 + REPEAT_GAP), 0, en);
      }

      const next = {
        ...round,
        queue,
        pos: round.pos + 1,
        revealed: false,
        right: round.right + (known ? 1 : 0),
        wrong: round.wrong + (known ? 0 : 1),
        missed: known || round.missed.includes(en) ? round.missed : [...round.missed, en],
      };

      if (next.pos >= queue.length) finish(next);
      else setRound(next);
    },
    [round, progress, stats, finish],
  );

  const quitRound = useCallback(() => {
    if (round) finish(round);
    else setScreen('home');
  }, [round, finish]);

  const refreshFromStorage = useCallback(() => {
    setProgress(loadProgress());
    setStats(loadStats());
  }, []);

  if (screen === 'card' && round) {
    return (
      <Card
        en={round.queue[round.pos]}
        direction={settings.direction}
        revealed={round.revealed}
        position={round.pos + 1}
        total={round.queue.length}
        right={round.right}
        wrong={round.wrong}
        onReveal={reveal}
        onAnswer={answer}
        onQuit={quitRound}
      />
    );
  }

  if (screen === 'summary' && summary) {
    return (
      <RoundSummary
        summary={summary}
        onAgain={startRound}
        onHome={() => {
          setSummary(null);
          setScreen('home');
        }}
      />
    );
  }

  if (screen === 'stats') {
    return (
      <Stats
        progress={progress}
        stats={stats}
        onBack={() => setScreen('home')}
        onDataChanged={refreshFromStorage}
      />
    );
  }

  return (
    <Home
      progress={progress}
      stats={stats}
      direction={settings.direction}
      seeded={SEEDED}
      persistent={persistent}
      onDirectionChange={setDirection}
      onStart={startRound}
      onStats={() => setScreen('stats')}
    />
  );
}
