import type { GameState, SaveEnvelope } from "../../../shared/gameTypes";

export function encodeSave(state: GameState): string {
  const envelope: SaveEnvelope = { version: 1, savedAt: new Date().toISOString(), state };
  return JSON.stringify(envelope);
}

export function decodeSave(raw: string): SaveEnvelope {
  const parsed = JSON.parse(raw) as SaveEnvelope;
  if (parsed.version !== 1 || !parsed.state?.map?.seed) {
    throw new Error("Unsupported save format");
  }
  return parsed;
}
