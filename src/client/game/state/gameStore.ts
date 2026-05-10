import { create } from "zustand";
import type { BuildingKey, GameState, Point } from "../../../shared/gameTypes";
import { createInitialGame, finishSettlement, placeBuilding, renderGameToText, selectBuilding, selectTile, startNight, stepGame } from "../core/game";
import { encodeSave, decodeSave } from "../core/saveCodec";

interface GameStore {
  state: GameState;
  guestMode: boolean;
  startNewGame: (seed?: string) => void;
  loadEncoded: (raw: string) => void;
  saveLocal: () => string;
  selectBuilding: (key: BuildingKey) => void;
  selectTile: (point: Point) => void;
  placeSelected: (point: Point) => void;
  startNight: () => void;
  settle: () => void;
  advance: (ms: number) => void;
}

const LOCAL_SAVE_KEY = "bankruptcy-defense-city:guest-save";

function loadInitial(): GameState {
  const raw = globalThis.localStorage?.getItem(LOCAL_SAVE_KEY);
  if (raw) {
    try {
      return decodeSave(raw).state;
    } catch {
      globalThis.localStorage?.removeItem(LOCAL_SAVE_KEY);
    }
  }
  return createInitialGame("hasan-pr1");
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: loadInitial(),
  guestMode: true,
  startNewGame: (seed = `debt-${Date.now().toString(36)}`) => {
    const next = createInitialGame(seed);
    set({ state: next });
    globalThis.localStorage?.setItem(LOCAL_SAVE_KEY, encodeSave(next));
  },
  loadEncoded: (raw) => set({ state: decodeSave(raw).state }),
  saveLocal: () => {
    const raw = encodeSave(get().state);
    globalThis.localStorage?.setItem(LOCAL_SAVE_KEY, raw);
    return raw;
  },
  selectBuilding: (key) => set(({ state }) => ({ state: selectBuilding(state, key) })),
  selectTile: (point) => set(({ state }) => ({ state: selectTile(state, point) })),
  placeSelected: (point) =>
    set(({ state }) => ({ state: placeBuilding(state, state.selectedBuilding ?? "GunTurret", point) })),
  startNight: () => set(({ state }) => ({ state: startNight(state) })),
  settle: () => set(({ state }) => ({ state: finishSettlement(state) })),
  advance: (ms) => {
    set(({ state }) => ({ state: stepGame(state, ms) }));
    globalThis.localStorage?.setItem(LOCAL_SAVE_KEY, encodeSave(get().state));
  },
}));

export function installGameDebugHooks(): void {
  const api = {
    render: () => renderGameToText(useGameStore.getState().state),
    advance: (ms: number) => useGameStore.getState().advance(ms),
  };
  (globalThis as typeof globalThis & { render_game_to_text?: () => string; advanceTime?: (ms: number) => void }).render_game_to_text =
    () => api.render();
  (globalThis as typeof globalThis & { render_game_to_text?: () => string; advanceTime?: (ms: number) => void }).advanceTime =
    (ms: number) => api.advance(ms);
}
