// Reine Spiellogik, keine UI-Abhängigkeiten.

export type OutMode = 'single' | 'double' | 'master';
export type InMode = 'straight' | 'double';
export type Multiplier = 1 | 2 | 3;

export interface Settings {
  startScore: number;
  out: OutMode;
  in: InMode;
}

export interface Dart {
  value: number; // 0-20 oder 25
  mult: Multiplier;
}

export interface Match {
  settings: Settings;
  playerIds: string[];
  darts: Dart[]; // alle Darts in Wurfreihenfolge (Quelle der Wahrheit)
}

export interface CompletedTurn {
  playerIdx: number;
  darts: Dart[];
  bust: boolean;
  scored: number; // 0 bei Bust
}

export interface PlayerStats {
  dartsThrown: number;
  pointsScored: number;
  average: number; // pro 3 Darts
  highestTurn: number;
  oneEighties: number;
}

export interface GameState {
  remaining: number[];
  currentIdx: number;
  turnDarts: Dart[];
  turns: CompletedTurn[];
  winnerIdx: number | null;
  lastTurn: CompletedTurn | null; // vom letzten Dart beendete Aufnahme (z. B. Bust-Anzeige)
  stats: PlayerStats[];
}

export const DEFAULT_SETTINGS: Settings = { startScore: 501, out: 'double', in: 'straight' };

export function isValidDart(value: number, mult: Multiplier): boolean {
  if (value === 0) return mult === 1;
  if (value === 25) return mult === 1 || mult === 2;
  return Number.isInteger(value) && value >= 1 && value <= 20;
}

export const dartScore = (d: Dart) => d.value * d.mult;

export function dartLabel(d: Dart): string {
  if (d.value === 0) return '0';
  if (d.value === 25) return d.mult === 2 ? 'Bull' : '25';
  return `${d.mult === 3 ? 'T' : d.mult === 2 ? 'D' : ''}${d.value}`;
}

function validOut(d: Dart, out: OutMode): boolean {
  if (out === 'single') return true;
  if (out === 'double') return d.mult === 2;
  return d.mult === 2 || d.mult === 3;
}

function initialStats(): PlayerStats {
  return { dartsThrown: 0, pointsScored: 0, average: 0, highestTurn: 0, oneEighties: 0 };
}

/** Berechnet den kompletten Spielstand durch Abspielen aller Darts. */
export function computeState(match: Match): GameState {
  const { settings, playerIds } = match;
  const n = playerIds.length;
  const remaining = playerIds.map(() => settings.startScore);
  const opened = playerIds.map(() => settings.in === 'straight');
  const stats = playerIds.map(initialStats);
  const turns: CompletedTurn[] = [];

  let currentIdx = 0;
  let turnDarts: Dart[] = [];
  let turnStartRemaining = remaining[0];
  let turnStartOpened = opened[0];
  let winnerIdx: number | null = null;
  let lastTurn: CompletedTurn | null = null;

  const endTurn = (bust: boolean) => {
    const scored = bust ? 0 : turnStartRemaining - remaining[currentIdx];
    const turn: CompletedTurn = { playerIdx: currentIdx, darts: turnDarts, bust, scored };
    turns.push(turn);
    lastTurn = turn;
    const s = stats[currentIdx];
    s.dartsThrown += turnDarts.length;
    s.pointsScored += scored;
    s.highestTurn = Math.max(s.highestTurn, scored);
    if (scored === 180) s.oneEighties += 1;
    s.average = s.dartsThrown > 0 ? (s.pointsScored / s.dartsThrown) * 3 : 0;
    if (winnerIdx === null) {
      currentIdx = (currentIdx + 1) % n;
      turnDarts = [];
      turnStartRemaining = remaining[currentIdx];
      turnStartOpened = opened[currentIdx];
    } else {
      turnDarts = [];
    }
  };

  for (const dart of match.darts) {
    if (winnerIdx !== null) break; // Darts nach Spielende werden ignoriert
    lastTurn = null;
    turnDarts = [...turnDarts, dart];
    const p = currentIdx;

    let pts = dartScore(dart);
    if (!opened[p]) {
      if (dart.mult === 2) opened[p] = true;
      else pts = 0;
    }

    const rest = remaining[p] - pts;
    const bust =
      rest < 0 ||
      (rest === 1 && settings.out !== 'single') ||
      (rest === 0 && !validOut(dart, settings.out));

    if (bust) {
      remaining[p] = turnStartRemaining;
      opened[p] = turnStartOpened;
      endTurn(true);
    } else if (rest === 0) {
      remaining[p] = 0;
      winnerIdx = p;
      endTurn(false);
    } else {
      remaining[p] = rest;
      if (turnDarts.length === 3) endTurn(false);
    }
  }

  return { remaining, currentIdx, turnDarts, turns, winnerIdx, lastTurn, stats };
}
