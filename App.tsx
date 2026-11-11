import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { computeState } from './src/engine';
import GameScreen from './src/screens/GameScreen';
import SetupScreen from './src/screens/SetupScreen';
import WinnerScreen from './src/screens/WinnerScreen';
import { useStore } from './src/store';

export default function App() {
  const [hydrated, setHydrated] = useState(useStore.persist.hasHydrated());
  const match = useStore((s) => s.match);
  const players = useStore((s) => s.players);

  useEffect(() => {
    if (useStore.persist.hasHydrated()) setHydrated(true);
    return useStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  const state = useMemo(() => (match ? computeState(match) : null), [match]);

  let screen = null;
  if (hydrated) {
    if (!match || !state) screen = <SetupScreen />;
    else if (state.winnerIdx !== null) screen = <WinnerScreen match={match} state={state} players={players} />;
    else screen = <GameScreen match={match} state={state} players={players} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {screen}
    </SafeAreaProvider>
  );
}
