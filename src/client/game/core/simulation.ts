import type { GameState, Point } from "../../../shared/gameTypes";
import {
  createInitialGame,
  finishSettlement,
  renderGameToText,
  selectTile as selectGameTile,
  startNight,
  stepGame,
} from "./game";

export function createInitialGameState(seed: string): GameState {
  return createInitialGame(seed);
}

export function advanceGame(state: GameState, elapsedMs: number): GameState {
  let next = state.phase === "day" ? startNight(state) : state;
  next = stepGame(next, elapsedMs);
  return next.phase === "settlement" ? finishSettlement(next) : next;
}

export function selectTile(state: GameState, point: Point): GameState {
  return selectGameTile(state, point);
}

export { renderGameToText };

