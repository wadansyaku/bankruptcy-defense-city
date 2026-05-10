import { create } from "zustand";
import type { BuildingKey, GameState, Point } from "../../shared/gameTypes";
import { advanceGame, createInitialGameState, renderGameToText, selectTile } from "./core/simulation";
import { placeBuilding } from "./core/game";

export interface GameHudEvent {
  readonly type: "state" | "tile" | "placement" | "phase";
  readonly payload?: unknown;
}

export interface GameStoreState {
  gameState: GameState;
  buildMode?: BuildingKey;
  setSeed(seed: string): void;
  setBuildMode(type?: BuildingKey): void;
  selectTile(point: Point): void;
  placeSelected(point: Point): boolean;
  advanceTime(ms: number): GameState;
  renderText(): string;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  gameState: createInitialGameState("PR1-DEFENSE"),
  buildMode: "Road",
  setSeed(seed) {
    set({ gameState: createInitialGameState(seed) });
  },
  setBuildMode(type) {
    set({ buildMode: type });
  },
  selectTile(point) {
    set((current) => ({ gameState: selectTile(current.gameState, point) }));
  },
  placeSelected(point) {
    const { gameState, buildMode } = get();
    if (!buildMode) {
      return false;
    }
    const next = placeBuilding(gameState, buildMode, point);
    const changed = next !== gameState;
    set({ gameState: next });
    return changed;
  },
  advanceTime(ms) {
    const next = advanceGame(get().gameState, ms);
    set({ gameState: next });
    return next;
  },
  renderText() {
    return renderGameToText(get().gameState);
  },
}));
