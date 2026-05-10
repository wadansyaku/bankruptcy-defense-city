import type { EnemyKey, GameState, WavePlan } from "../../../shared/gameTypes";

export function createWavePlan(day: number, state: GameState): WavePlan {
  const entries: WavePlan["entries"] = [];
  const debtPressure = Math.min(4, Math.floor(state.resources.debt / 2500));
  const taxPressure = state.resources.taxRisk > 55 ? 1 : 0;
  const riotPressure = state.resources.happiness < 40 ? 1 : 0;
  entries.push({ enemy: "DebtCollector", count: 6 + day + debtPressure, intervalMs: 800 });
  if (taxPressure) entries.push({ enemy: "TaxInspector", count: 2 + Math.floor(state.resources.taxRisk / 25), intervalMs: 1200 });
  if (riotPressure) entries.push({ enemy: "Rioter", count: 3 + Math.floor((45 - state.resources.happiness) / 7), intervalMs: 700 });
  if (day >= 3) entries.push({ enemy: "CorporateSpy", count: 2 + Math.floor(day / 4), intervalMs: 1100 });
  if (day >= 4) entries.push({ enemy: "ArmoredComplainer", count: 1 + Math.floor(day / 6), intervalMs: 1800 });
  if (day % 5 === 0) entries.push({ enemy: "BankruptcyTrusteeBoss", count: 1, intervalMs: 1000 });
  return { day, entries };
}

export function flattenWave(plan: WavePlan): EnemyKey[] {
  return plan.entries.flatMap((entry) => Array.from({ length: entry.count }, () => entry.enemy));
}
