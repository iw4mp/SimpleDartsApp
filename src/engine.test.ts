import { describe, expect, it } from 'vitest';
import { computeState, Dart, DEFAULT_SETTINGS, Match, Settings } from './engine';

const S = (v: number): Dart => ({ value: v, mult: 1 });
const D = (v: number): Dart => ({ value: v, mult: 2 });
const T = (v: number): Dart => ({ value: v, mult: 3 });

const match = (darts: Dart[], settings: Partial<Settings> = {}, players = 2): Match => ({
  settings: { ...DEFAULT_SETTINGS, ...settings },
  playerIds: Array.from({ length: players }, (_, i) => `p${i}`),
  darts,
});

describe('computeState', () => {
  it('startet bei Startscore, Spieler 0 ist dran', () => {
    const s = computeState(match([]));
    expect(s.remaining).toEqual([501, 501]);
    expect(s.currentIdx).toBe(0);
  });

  it('zieht Punkte ab und wechselt nach 3 Darts', () => {
    const s = computeState(match([T(20), T(20), T(20), S(1)]));
    expect(s.remaining).toEqual([321, 500]);
    expect(s.currentIdx).toBe(1);
    expect(s.turnDarts).toHaveLength(1);
    expect(s.stats[0].oneEighties).toBe(1);
    expect(s.stats[0].average).toBe(180);
  });

  it('Bust bei Rest < 0 setzt die Aufnahme zurück und wechselt den Spieler', () => {
    // P0 hat 50 Rest, wirft S10 (40) und T20 (60) -> Bust, zurück auf 50
    const s = computeState(match([S(10), T(20)], { startScore: 50 }));
    expect(s.remaining).toEqual([50, 50]);
    expect(s.turns[0].bust).toBe(true);
    expect(s.turns[0].scored).toBe(0);
    expect(s.currentIdx).toBe(1);
  });

  it('Rest 1 ist bei Double-Out Bust, bei Single-Out nicht', () => {
    // 140 - 60 - 60 = 20, - 19 = 1
    const dbl = computeState(match([T(20), T(20), S(19)], { startScore: 140 }, 1));
    expect(dbl.turns[0].bust).toBe(true);
    expect(dbl.remaining[0]).toBe(140);
    const sgl = computeState(match([T(20), T(20), S(19)], { startScore: 140, out: 'single' }, 1));
    expect(sgl.remaining[0]).toBe(1);
    expect(sgl.turns[0].bust).toBe(false);
  });

  it('Gewinn nur mit Double bei Double-Out', () => {
    const noDouble = computeState(match([S(20)], { startScore: 20 }, 1));
    expect(noDouble.winnerIdx).toBeNull();
    expect(noDouble.remaining[0]).toBe(20);
    const win = computeState(match([D(10)], { startScore: 20 }, 1));
    expect(win.winnerIdx).toBe(0);
    expect(win.remaining[0]).toBe(0);
  });

  it('Bullseye (D25) ist ein gültiges Double', () => {
    const s = computeState(match([D(25)], { startScore: 50 }, 1));
    expect(s.winnerIdx).toBe(0);
  });

  it('Master-Out erlaubt Triple', () => {
    const s = computeState(match([T(10)], { startScore: 30, out: 'master' }, 1));
    expect(s.winnerIdx).toBe(0);
  });

  it('Double-In: Punkte zählen erst nach dem ersten Double', () => {
    const s = computeState(match([S(20), T(20), D(10), S(5)], { in: 'double' }, 1));
    // S20, T20 zählen nicht, D10 öffnet (20), S5 zählt -> 501-25
    expect(s.remaining[0]).toBe(476);
  });

  it('Darts nach dem Sieg werden ignoriert', () => {
    const s = computeState(match([D(10), S(5)], { startScore: 20 }, 2));
    expect(s.winnerIdx).toBe(0);
    expect(s.remaining).toEqual([0, 20]);
  });

  it('Undo = letzten Dart entfernen ergibt vorherigen Zustand', () => {
    const darts = [T(20), S(5), D(3), T(19), S(1)];
    const before = computeState(match(darts.slice(0, -1)));
    const after = computeState(match(darts));
    expect(after.remaining).not.toEqual(before.remaining);
    expect(computeState(match(darts.slice(0, -1)))).toEqual(before);
  });
});
