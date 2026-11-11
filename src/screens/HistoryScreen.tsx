import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { computeState, dartLabel, decodeDart } from '../engine';
import { HistoryEntry, useStore } from '../store';
import { colors } from '../theme';

const outLabel = { single: 'Single', double: 'Double', master: 'Master' } as const;

const formatDate = (ts: number) =>
  new Date(ts).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

function EntryCard({ entry, onDelete }: { entry: HistoryEntry; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const state = useMemo(
    () =>
      computeState({
        settings: entry.settings,
        playerIds: entry.players.map((p) => p.id),
        darts: entry.darts.map(decodeDart),
      }),
    [entry],
  );
  const winner = entry.players[entry.winnerIdx]?.name ?? '?';

  return (
    <Pressable
      onPress={() => setOpen((o) => !o)}
      onLongPress={() =>
        Alert.alert('Spiel löschen', 'Dieses Spiel aus dem Verlauf entfernen?', [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Löschen', style: 'destructive', onPress: onDelete },
        ])
      }
      style={styles.card}
    >
      <View style={styles.cardTop}>
        <Text style={styles.winner}>🏆 {winner}</Text>
        <Text style={styles.date}>{formatDate(entry.finishedAt)}</Text>
      </View>
      <Text style={styles.meta}>
        {entry.settings.startScore} · {outLabel[entry.settings.out]} Out
        {entry.settings.in === 'double' ? ' · Double In' : ''} · {entry.players.map((p) => p.name).join(', ')}
      </Text>

      {open && (
        <View style={styles.details}>
          {entry.players.map((p, idx) => {
            const s = state.stats[idx];
            const turns = state.turns.filter((t) => t.playerIdx === idx);
            return (
              <View key={p.id} style={styles.playerBlock}>
                <Text style={styles.playerHead}>
                  {p.name} · Ø {s.average.toFixed(1)} · Max {s.highestTurn} · {s.dartsThrown} Darts
                </Text>
                {turns.map((t, i) => (
                  <Text key={i} style={[styles.turn, t.bust && { color: colors.danger }]}>
                    {i + 1}. {t.darts.map(dartLabel).join('  ')}
                    {t.bust ? '  (Bust)' : `  = ${t.scored}`}
                  </Text>
                ))}
              </View>
            );
          })}
          <Text style={styles.hint}>Gedrückt halten = löschen</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function HistoryScreen({ onBack }: { onBack: () => void }) {
  const history = useStore((s) => s.history);
  const deleteHistoryEntry = useStore((s) => s.deleteHistoryEntry);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={10}>
          <Text style={styles.back}>‹ Zurück</Text>
        </Pressable>
        <Text style={styles.title}>Verlauf</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        {history.length === 0 && <Text style={styles.empty}>Noch keine abgeschlossenen Spiele.</Text>}
        {history.map((h) => (
          <EntryCard key={h.id} entry={h} onDelete={() => deleteHistoryEntry(h.id)} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  back: { color: colors.accent, fontSize: 16, fontWeight: '700', width: 60 },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 14, gap: 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  winner: { color: colors.text, fontSize: 17, fontWeight: '800' },
  date: { color: colors.muted, fontSize: 13 },
  meta: { color: colors.muted, fontSize: 13 },
  details: { marginTop: 10, gap: 12 },
  playerBlock: { gap: 3 },
  playerHead: { color: colors.text, fontWeight: '700', fontSize: 14 },
  turn: { color: colors.muted, fontSize: 13, fontVariant: ['tabular-nums'] },
  hint: { color: colors.muted, fontSize: 12, textAlign: 'center' },
});
