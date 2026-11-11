import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { computeState, DEFAULT_SETTINGS, Dart, encodeDart, isValidDart, Match, Multiplier, Settings } from './engine';

export interface Player {
  id: string;
  name: string;
  lastPlayedAt: number;
}

export interface HistoryEntry {
  id: string;
  startedAt: number;
  finishedAt: number;
  settings: Settings;
  players: { id: string; name: string }[]; // Namen als Momentaufnahme (Spieler können später gelöscht werden)
  darts: number[]; // kompakt: Wert*10 + Multiplikator, siehe encodeDart
  winnerIdx: number;
}

const HISTORY_LIMIT = 300;

interface Store {
  players: Player[];
  history: HistoryEntry[];
  selectedIds: string[]; // in Auswahlreihenfolge = Wurfreihenfolge
  settings: Settings;
  match: Match | null;
  modifier: Multiplier;

  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  toggleSelected: (id: string) => void;
  shuffleSelected: () => void;
  setSettings: (s: Partial<Settings>) => void;

  startMatch: () => void;
  rematch: () => void;
  leaveMatch: () => void;
  finalizeFinishedMatch: () => void;
  deleteHistoryEntry: (id: string) => void;
  setModifier: (m: Multiplier) => void;
  throwDart: (value: number) => void;
  undo: () => void;
}

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/** Baut einen Historien-Eintrag, wenn das Spiel einen Sieger hat, sonst null. */
function buildHistoryEntry(match: Match, players: Player[]): HistoryEntry | null {
  const state = computeState(match);
  if (state.winnerIdx === null) return null;
  return {
    id: match.id ?? newId(),
    startedAt: match.startedAt ?? Date.now(),
    finishedAt: Date.now(),
    settings: match.settings,
    players: match.playerIds.map((id) => ({ id, name: players.find((p) => p.id === id)?.name ?? '?' })),
    darts: match.darts.map(encodeDart),
    winnerIdx: state.winnerIdx,
  };
}

const withEntry = (history: HistoryEntry[], entry: HistoryEntry | null) =>
  entry && !history.some((h) => h.id === entry.id) ? [entry, ...history].slice(0, HISTORY_LIMIT) : history;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      players: [],
      history: [],
      selectedIds: [],
      settings: DEFAULT_SETTINGS,
      match: null,
      modifier: 1,

      addPlayer: (rawName) => {
        const name = rawName.trim();
        if (!name) return;
        const existing = get().players.find((p) => p.name.toLowerCase() === name.toLowerCase());
        if (existing) {
          // Vorhandenen Spieler einfach auswählen
          if (!get().selectedIds.includes(existing.id)) get().toggleSelected(existing.id);
          return;
        }
        const player: Player = { id: newId(), name, lastPlayedAt: 0 };
        set((s) => ({ players: [...s.players, player], selectedIds: [...s.selectedIds, player.id] }));
      },

      removePlayer: (id) =>
        set((s) => ({
          players: s.players.filter((p) => p.id !== id),
          selectedIds: s.selectedIds.filter((x) => x !== id),
        })),

      toggleSelected: (id) =>
        set((s) => ({
          selectedIds: s.selectedIds.includes(id)
            ? s.selectedIds.filter((x) => x !== id)
            : [...s.selectedIds, id],
        })),

      shuffleSelected: () =>
        set((s) => {
          const a = [...s.selectedIds];
          for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
          }
          return { selectedIds: a };
        }),

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      startMatch: () => {
        const { selectedIds, settings } = get();
        if (selectedIds.length < 2) return;
        const now = Date.now();
        set((s) => ({
          match: { id: newId(), startedAt: now, settings, playerIds: [...selectedIds], darts: [] },
          modifier: 1,
          players: s.players.map((p) => (selectedIds.includes(p.id) ? { ...p, lastPlayedAt: now } : p)),
        }));
      },

      rematch: () => {
        const m = get().match;
        if (!m) return;
        // Startspieler rotiert: wer zuletzt angefangen hat, wirft diesmal als Letzter
        const ids = [...m.playerIds.slice(1), m.playerIds[0]];
        set((s) => ({
          history: withEntry(s.history, buildHistoryEntry(m, s.players)),
          match: { id: newId(), startedAt: Date.now(), settings: m.settings, playerIds: ids, darts: [] },
          modifier: 1,
        }));
      },

      // Beendet das Spiel. Nur ein Spiel mit Sieger landet in der Historie ("Beenden" mittendrin nicht).
      leaveMatch: () =>
        set((s) => ({
          history: s.match ? withEntry(s.history, buildHistoryEntry(s.match, s.players)) : s.history,
          match: null,
          modifier: 1,
        })),

      // Nach App-Neustart auf dem Sieg-Screen: das fertige Spiel archivieren statt es hängen zu lassen.
      finalizeFinishedMatch: () => {
        const { match, players, history } = get();
        if (!match) return;
        const entry = buildHistoryEntry(match, players);
        if (entry) set({ history: withEntry(history, entry), match: null, modifier: 1 });
      },

      deleteHistoryEntry: (id) => set((s) => ({ history: s.history.filter((h) => h.id !== id) })),

      setModifier: (m) => set((s) => ({ modifier: s.modifier === m ? 1 : m })),

      throwDart: (value) => {
        const { match, modifier } = get();
        if (!match || !isValidDart(value, modifier)) return;
        const dart: Dart = { value, mult: modifier };
        set({ match: { ...match, darts: [...match.darts, dart] }, modifier: 1 });
      },

      undo: () => {
        const { match } = get();
        if (!match || match.darts.length === 0) return;
        set({ match: { ...match, darts: match.darts.slice(0, -1) }, modifier: 1 });
      },
    }),
    {
      name: 'darts-scorer-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        players: s.players,
        history: s.history,
        selectedIds: s.selectedIds,
        settings: s.settings,
        match: s.match,
      }),
    },
  ),
);
