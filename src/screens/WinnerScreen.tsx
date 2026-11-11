import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameState, Match } from '../engine';
import { Player, useStore } from '../store';
import { colors } from '../theme';

interface Props {
  match: Match;
  state: GameState;
  players: Player[];
}

export default function WinnerScreen({ match, state, players }: Props) {
  const undo = useStore((s) => s.undo);
  const rematch = useStore((s) => s.rematch);
  const leaveMatch = useStore((s) => s.leaveMatch);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);

  const nameOf = (idx: number) => players.find((p) => p.id === match.playerIds[idx])?.name ?? '?';
  const winner = state.winnerIdx ?? 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.trophy}>🏆</Text>
        <Text style={styles.winner}>{nameOf(winner)}</Text>
        <Text style={styles.sub}>gewinnt das Spiel!</Text>

        <View style={styles.table}>
          <View style={styles.tr}>
            <Text style={[styles.th, { flex: 2 }]}>Spieler</Text>
            <Text style={styles.th}>Ø</Text>
            <Text style={styles.th}>Max</Text>
            <Text style={styles.th}>180</Text>
            <Text style={styles.th}>Darts</Text>
          </View>
          {match.playerIds.map((id, idx) => {
            const s = state.stats[idx];
            return (
              <View key={id} style={styles.tr}>
                <Text style={[styles.td, { flex: 2, fontWeight: '800' }]} numberOfLines={1}>
                  {nameOf(idx)}
                </Text>
                <Text style={styles.td}>{s.average.toFixed(1)}</Text>
                <Text style={styles.td}>{s.highestTurn}</Text>
                <Text style={styles.td}>{s.oneEighties}</Text>
                <Text style={styles.td}>{s.dartsThrown}</Text>
              </View>
            );
          })}
        </View>

        <Pressable onPress={rematch} style={styles.primary}>
          <Text style={styles.primaryText}>Revanche</Text>
        </Pressable>
        <Pressable onPress={leaveMatch} style={styles.secondary}>
          <Text style={styles.secondaryText}>Neues Spiel</Text>
        </Pressable>
        <Pressable onPress={undo} hitSlop={10}>
          <Text style={styles.link}>↩ Letzten Wurf korrigieren</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12 },
  trophy: { fontSize: 64 },
  winner: { color: colors.text, fontSize: 36, fontWeight: '900' },
  sub: { color: colors.muted, fontSize: 18, marginBottom: 12 },
  table: { alignSelf: 'stretch', backgroundColor: colors.card, borderRadius: 14, padding: 12, marginBottom: 12 },
  tr: { flexDirection: 'row', paddingVertical: 6 },
  th: { flex: 1, color: colors.muted, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  td: { flex: 1, color: colors.text, fontSize: 15, textAlign: 'center' },
  primary: { alignSelf: 'stretch', backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  primaryText: { color: colors.text, fontSize: 18, fontWeight: '800' },
  secondary: { alignSelf: 'stretch', backgroundColor: colors.key, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  secondaryText: { color: colors.text, fontSize: 18, fontWeight: '700' },
  link: { color: colors.muted, fontWeight: '700', marginTop: 8 },
});
