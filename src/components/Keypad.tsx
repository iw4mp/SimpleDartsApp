import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { isValidDart, Multiplier } from '../engine';
import { colors } from '../theme';

interface Props {
  modifier: Multiplier;
  onDart: (value: number) => void;
  onModifier: (m: Multiplier) => void;
  onUndo: () => void;
}

const NUMBER_ROWS = [
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
];

function Key({
  label,
  onPress,
  disabled,
  active,
  tone,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
  tone?: 'danger';
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.key,
        active && styles.keyActive,
        tone === 'danger' && styles.keyDanger,
        pressed && { opacity: 0.6 },
        disabled && { opacity: 0.25 },
      ]}
    >
      <Text style={[styles.keyText, label.length > 3 && { fontSize: 11 }]} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </Pressable>
  );
}

export default function Keypad({ modifier, onDart, onModifier, onUndo }: Props) {
  const num = (v: number) => (
    <Key key={v} label={String(v)} onPress={() => onDart(v)} disabled={!isValidDart(v, modifier)} />
  );
  return (
    <View style={styles.pad}>
      {NUMBER_ROWS.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map(num)}
        </View>
      ))}
      <View style={styles.row}>
        {num(20)}
        {num(25)}
        <Key label="DOUBLE" active={modifier === 2} onPress={() => onModifier(2)} />
        <Key label="TRIPLE" active={modifier === 3} onPress={() => onModifier(3)} />
        <Key label="⌫" tone="danger" onPress={onUndo} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { gap: 6, padding: 8 },
  row: { flexDirection: 'row', gap: 6 },
  key: {
    flex: 1,
    height: 58,
    backgroundColor: colors.key,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  keyActive: { backgroundColor: colors.accent },
  keyDanger: { backgroundColor: colors.accentSoft },
  keyText: { color: colors.text, fontSize: 22, fontWeight: '800' },
});
