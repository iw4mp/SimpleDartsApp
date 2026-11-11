import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InMode, OutMode } from '../engine';
import { useStore } from '../store';
import { colors } from '../theme';

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => (
        <Pressable
          key={String(o.value)}
          onPress={() => onChange(o.value)}
          style={[styles.segment, o.value === value && styles.segmentActive]}
        >
          <Text style={[styles.segmentText, o.value === value && { color: colors.text }]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function SetupScreen() {
  const players = useStore((s) => s.players);
  const selectedIds = useStore((s) => s.selectedIds);
  const settings = useStore((s) => s.settings);
  const addPlayer = useStore((s) => s.addPlayer);
  const removePlayer = useStore((s) => s.removePlayer);
  const toggleSelected = useStore((s) => s.toggleSelected);
  const shuffleSelected = useStore((s) => s.shuffleSelected);
  const setSettings = useStore((s) => s.setSettings);
  const startMatch = useStore((s) => s.startMatch);
  const [name, setName] = useState('');

  const sorted = useMemo(
    () => [...players].sort((a, b) => b.lastPlayedAt - a.lastPlayedAt || a.name.localeCompare(b.name)),
    [players],
  );

  const submit = () => {
    addPlayer(name);
    setName('');
  };

  const confirmRemove = (id: string, playerName: string) =>
    Alert.alert('Spieler löschen', `"${playerName}" aus der Liste entfernen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => removePlayer(id) },
    ]);

  const canStart = selectedIds.length >= 2;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>DARTS SCORER 🎯</Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Spieler</Text>
            {selectedIds.length > 1 && (
              <Pressable onPress={shuffleSelected} hitSlop={8}>
                <Text style={styles.link}>🔀 Mischen</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Spieler hinzufügen"
              placeholderTextColor={colors.muted}
              onSubmitEditing={submit}
              returnKeyType="done"
              maxLength={20}
            />
            <Pressable onPress={submit} style={styles.addBtn} accessibilityLabel="Spieler hinzufügen">
              <Text style={styles.addBtnText}>+</Text>
            </Pressable>
          </View>

          <View style={styles.chips}>
            {sorted.length === 0 && (
              <Text style={styles.hint}>Noch keine Spieler. Namen eintippen und + drücken.</Text>
            )}
            {sorted.map((p) => {
              const idx = selectedIds.indexOf(p.id);
              const active = idx >= 0;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => toggleSelected(p.id)}
                  onLongPress={() => confirmRemove(p.id, p.name)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={styles.chipText}>
                    {active ? `${idx + 1}  ` : ''}
                    {p.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {sorted.length > 0 && <Text style={styles.hint}>Antippen = auswählen · Gedrückt halten = löschen</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Spiel</Text>
          <Text style={styles.label}>Punkte</Text>
          <Segmented
            options={[301, 501, 701].map((v) => ({ label: String(v), value: v }))}
            value={settings.startScore}
            onChange={(v) => setSettings({ startScore: v })}
          />
          <Text style={styles.label}>Out</Text>
          <Segmented<OutMode>
            options={[
              { label: 'Single', value: 'single' },
              { label: 'Double', value: 'double' },
              { label: 'Master', value: 'master' },
            ]}
            value={settings.out}
            onChange={(v) => setSettings({ out: v })}
          />
          <Text style={styles.label}>In</Text>
          <Segmented<InMode>
            options={[
              { label: 'Straight', value: 'straight' },
              { label: 'Double', value: 'double' },
            ]}
            value={settings.in}
            onChange={(v) => setSettings({ in: v })}
          />
        </View>

        <Pressable onPress={startMatch} disabled={!canStart} style={[styles.start, !canStart && { opacity: 0.4 }]}>
          <Text style={styles.startText}>Spiel starten</Text>
        </Pressable>
        {!canStart && <Text style={[styles.hint, { textAlign: 'center' }]}>Mindestens 2 Spieler auswählen</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 16, gap: 16 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', textAlign: 'center', marginVertical: 8 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  link: { color: colors.accent, fontWeight: '700' },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: colors.bg,
    color: colors.text,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  addBtn: { backgroundColor: colors.accent, borderRadius: 10, width: 44, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: colors.text, fontSize: 24, fontWeight: '700', marginTop: -2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.chip, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  chipActive: { backgroundColor: colors.accent },
  chipText: { color: colors.text, fontWeight: '700', fontSize: 16 },
  hint: { color: colors.muted, fontSize: 13 },
  label: { color: colors.muted, fontSize: 13, marginTop: 4 },
  segmented: { flexDirection: 'row', backgroundColor: colors.bg, borderRadius: 10, padding: 3 },
  segment: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.accent },
  segmentText: { color: colors.muted, fontWeight: '700' },
  start: { backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  startText: { color: colors.text, fontSize: 20, fontWeight: '800' },
});
