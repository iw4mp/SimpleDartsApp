import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { computeState } from './src/engine';
import GameScreen from './src/screens/GameScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SetupScreen from './src/screens/SetupScreen';
import WinnerScreen from './src/screens/WinnerScreen';
import { useStore } from './src/store';

export default function App() {
  const [hydrated, setHydrated] = useState(useStore.persist.hasHydrated());
  const [showHistory, setShowHistory] = useState(false);
  const match = useStore((s) => s.match);
  const players = useStore((s) => s.players);

  useEffect(() => {
    const done = () => {
      // Ein beim App-Schließen fertig gespieltes Spiel in die Historie übernehmen
      useStore.getState().finalizeFinishedMatch();
      setHydrated(true);
    };
    if (useStore.persist.hasHydrated()) done();
    return useStore.persist.onFinishHydration(done);
  }, []);

  const state = useMemo(() => (match ? computeState(match) : null), [match]);

  let screen = null;
  if (hydrated) {
    if (!match || !state) {
      screen = showHistory ? (
        <HistoryScreen onBack={() => setShowHistory(false)} />
      ) : (
        <SetupScreen onOpenHistory={() => setShowHistory(true)} />
      );
    } else if (state.winnerIdx !== null) screen = <WinnerScreen match={match} state={state} players={players} />;
    else screen = <GameScreen match={match} state={state} players={players} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {screen}
    </SafeAreaProvider>
  );
}
