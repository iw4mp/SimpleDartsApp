import { Dart, dartScore, OutMode, validOut } from './engine';

// Alle sinnvollen Darts (ohne 0): S1-S20, D1-D20, T1-T20, 25, Bull
const ALL_DARTS: Dart[] = [];
for (let v = 1; v <= 20; v++) {
  ALL_DARTS.push({ value: v, mult: 1 }, { value: v, mult: 2 }, { value: v, mult: 3 });
}
ALL_DARTS.push({ value: 25, mult: 1 }, { value: 25, mult: 2 });

const DOUBLE_PREF = [20, 16, 10, 8, 18, 12, 14, 6, 4, 2, 19, 17, 15, 13, 11, 9, 7, 5, 3, 1];

/** Aufwand eines Darts, der NICHT beendet (Vorbereitung): kleiner = bevorzugt. */
function setupCost(d: Dart): number {
  if (d.value === 25) return d.mult === 2 ? 15 : 12;
  if (d.mult === 3) return d.value >= 15 ? 20 - d.value : 30 - d.value;
  if (d.mult === 1) return 26 - d.value;
  return 40 - d.value;
}

/** Aufwand des beendenden Darts: Lieblingsdoubles zuerst. */
function finishCost(d: Dart): number {
  if (d.mult === 2) {
    if (d.value === 25) return 3;
    return DOUBLE_PREF.indexOf(d.value);
  }
  if (d.mult === 3) return 30 + (20 - d.value);
  return 60 + (20 - d.value);
}

const SETUP_DARTS = [...ALL_DARTS].sort((a, b) => setupCost(a) - setupCost(b));

interface Found {
  darts: Dart[];
  cost: number;
}

/** Günstigster Weg mit genau `n` Darts: n-1 Vorbereitungsdarts, dann ein beendender Dart. */
function searchBest(rest: number, n: number, finishers: Dart[], out: OutMode): Found | null {
  if (n === 1) {
    let best: Found | null = null;
    for (const f of finishers) {
      if (dartScore(f) !== rest) continue;
      const cost = finishCost(f);
      if (!best || cost < best.cost) best = { darts: [f], cost };
    }
    return best;
  }
  const minRest = out === 'single' ? 1 : 2; // Zwischenrest muss weiterspielbar sein
  let best: Found | null = null;
  for (const d of SETUP_DARTS) {
    const r = rest - dartScore(d);
    if (r < minRest) continue;
    const sub = searchBest(r, n - 1, finishers, out);
    if (!sub) continue;
    const cost = setupCost(d) + sub.cost;
    if (!best || cost < best.cost) best = { darts: [d, ...sub.darts], cost };
  }
  return best;
}

const cache = new Map<string, Dart[] | null>();

/**
 * Bester Weg, `rest` mit höchstens `dartsLeft` Darts zu beenden, oder null.
 * Berücksichtigt den Out-Modus (Double/Master/Single).
 */
export function getCheckout(rest: number, dartsLeft: number, out: OutMode): Dart[] | null {
  if (rest < 1 || rest > 170 || dartsLeft < 1) return null;
  const key = `${rest}|${dartsLeft}|${out}`;
  if (cache.has(key)) return cache.get(key)!;

  const finishers = ALL_DARTS.filter((d) => validOut(d, out));
  let result: Dart[] | null = null;

  // Wenig Darts bevorzugt: erst 1, dann 2, dann 3
  for (let n = 1; n <= dartsLeft && !result; n++) {
    const found = searchBest(rest, n, finishers, out);
    if (found) result = found.darts;
  }

  cache.set(key, result);
  return result;
}
