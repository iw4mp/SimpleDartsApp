import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Keypad from '../components/Keypad';
import { getCheckout } from '../checkout';
import { dartLabel, GameState, Match } from '../engine';
import { Player, useStore } from '../store';
import { colors } from '../theme';

interface Props {
  match: Match;
  state: GameState;
  players: Player[];
}

export default function GameScreen({ match, state, players }: Props) {
  useKeepAwake();
  const modifier = useStore((s) => s.modifier);
  const throwDart = useStore((s) => s.throwDart);
  const setModifier = useStore((s) => s.setModifier);
  const undo = useStore((s) => s.undo);
  const leaveMatch = useStore((s) => s.leaveMatch);

  const nameOf = (idx: number) => players.find((p) => p.id === match.playerIds[idx])?.name ?? '?';

  // Haptik bei Bust
  const lastTurn = state.lastTurn;
  useEffect(() => {
    if (lastTurn?.bust) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  }, [lastTurn]);

  const confirmLeave = () =>
    Alert.alert('Spiel beenden?', 'Der aktuelle Spielstand geht verloren.', [
      { text: 'Weiterspielen', style: 'cancel' },
      { text: 'Beenden', style: 'destructive', onPress: leaveMatch },
    ]);

  const current = state.currentIdx;
  const darts = state.turnDarts;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={confirmLeave} hitSlop={10}>
          <Text style={styles.headerLink}>✕ Beenden</Text>
        </Pressable>
        <Text style={styles.headerInfo}>
          {match.settings.startScore} · {match.settings.out === 'single' ? 'Single' : match.settings.out === 'double' ? 'Double' : 'Master'} Out
          {match.settings.in === 'double' ? ' · Double In' : ''}
        </Text>
      </View>

      <ScrollView style={styles.board} contentContainerStyle={{ gap: 8, padding: 8 }}>
        {match.playerIds.map((id, idx) => {
          const active = idx === current;
          const stats = state.stats[idx];
          // Aktiver Spieler: nur noch die verbleibenden Darts der Aufnahme, sonst volle 3
          const dartsLeft = active ? 3 - darts.length : 3;
          const route =
            state.opened[idx] && dartsLeft > 0
              ? getCheckout(state.remaining[idx], dartsLeft, match.settings.out)
              : null;
          return (
            <View key={id} style={[styles.playerRow, active && styles.playerRowActive]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.playerName, active && { color: colors.text }]} numberOfLines={1}>
                  {active ? '▶ ' : ''}
                  {nameOf(idx)}
                </Text>
                <Text style={styles.playerAvg}>Ø {stats.average.toFixed(1)}</Text>
                {route && (
                  <Text style={[styles.checkout, active && styles.checkoutActive]} numberOfLines={1}>
                    🎯 {route.map(dartLabel).join(' · ')}
                  </Text>
                )}
              </View>
              <Text style={[styles.remaining, active && styles.remainingActive]}>{state.remaining[idx]}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.turn}>
        <Text style={styles.turnWho}>{nameOf(current)} wirft</Text>
        <View style={styles.dartsRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dartBox, darts[i] && styles.dartBoxFilled]}>
              <Text style={styles.dartText}>{darts[i] ? dartLabel(darts[i]) : '–'}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.turnInfo, lastTurn?.bust && { color: colors.danger, fontWeight: '800' }]}>
          {lastTurn
            ? lastTurn.bust
              ? `BUST! ${nameOf(lastTurn.playerIdx)} bleibt bei ${state.remaining[lastTurn.playerIdx]}`
              : `${nameOf(lastTurn.playerIdx)}: ${lastTurn.scored} Punkte`
            : modifier === 2
              ? 'Double aktiv'
              : modifier === 3
                ? 'Triple aktiv'
                : ' '}
        </Text>
      </View>

      <Keypad modifier={modifier} onDart={throwDart} onModifier={setModifier} onUndo={undo} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  headerLink: { color: colors.muted, fontWeight: '700' },
  headerInfo: { color: colors.muted, fontSize: 13 },
  board: { flex: 1 },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  playerRowActive: { borderColor: colors.accent, backgroundColor: '#2a1f1a' },
  playerName: { color: colors.muted, fontSize: 18, fontWeight: '700' },
  playerAvg: { color: colors.muted, fontSize: 13, marginTop: 2 },
  checkout: { color: colors.muted, fontSize: 13, fontWeight: '700', marginTop: 2 },
  checkoutActive: { color: colors.accent, fontSize: 15 },
  remaining: { color: colors.muted, fontSize: 40, fontWeight: '900', fontVariant: ['tabular-nums'] },
  remainingActive: { color: colors.text, fontSize: 48 },
  turn: { alignItems: 'center', gap: 6, paddingVertical: 8 },
  turnWho: { color: colors.text, fontSize: 16, fontWeight: '700' },
  dartsRow: { flexDirection: 'row', gap: 10 },
  dartBox: {
    width: 72,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dartBoxFilled: { backgroundColor: colors.chip },
  dartText: { color: colors.text, fontSize: 18, fontWeight: '800' },
  turnInfo: { color: colors.accent, fontSize: 14, minHeight: 18 },
});
