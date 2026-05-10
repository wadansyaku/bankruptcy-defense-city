import { BUILDING_DEFINITIONS, RESOURCE_KEYS, VICTORY_DAY } from "../../../shared/constants";
import type { GameState, Resources, SettlementResult } from "../../../shared/gameTypes";
import { addResources, cloneResources } from "./resources";

export function settleDay(state: GameState): GameState {
  let resources = cloneResources(state.resources);
  let revenue = 0;
  let upkeep = 0;
  let happinessDelta = 0;
  let taxRiskDelta = 0;

  for (const building of state.buildings) {
    const definition = BUILDING_DEFINITIONS[building.key];
    if (!building.enabled || building.hp <= 0) continue;
    resources = addResources(resources, definition.produces);
    resources = addResources(resources, definition.upkeep, -1);
    revenue += definition.produces.money ?? 0;
    upkeep += Object.entries(definition.upkeep).reduce((sum, [key, value]) => sum + (key === "money" ? value ?? 0 : 0), 0);
    happinessDelta += definition.produces.happiness ?? 0;
    taxRiskDelta += definition.produces.taxRisk ?? 0;
  }

  const interest = Math.ceil(resources.debt * resources.interestRate);
  resources.money -= interest;
  resources.taxRisk += Math.ceil(resources.money / 2500);
  resources.happiness -= Math.max(0, Math.ceil(resources.debt / 3500) - 1);
  const gachaCurrencyReward = 12 + Math.max(0, Math.floor((resources.happiness - 45) / 5));
  resources.gachaCurrency += gachaCurrencyReward;

  for (const key of RESOURCE_KEYS) {
    if (key === "happiness" || key === "taxRisk") {
      resources[key] = Math.max(0, Math.min(100, Math.round(resources[key])));
    } else if (key !== "interestRate") {
      resources[key] = Math.round(resources[key]);
    }
  }

  const bankrupt = resources.money < 0 && resources.debt > state.debtLimit;
  const lines = [
    `売上 ${revenue} / 維持費 ${upkeep} / 利息 ${interest}`,
    resources.taxRisk > 70 ? "税務署がこちらを見ています。" : "税務署はまだ瞬きをしています。",
    resources.happiness < 35 ? "住民がやや人間らしい不満を述べています。" : "住民はまだ社会性を保っています。",
    `無料ガチャ通貨 +${gachaCurrencyReward}`,
  ];
  const settlement: SettlementResult = { revenue, upkeep, interest, happinessDelta, taxRiskDelta, gachaCurrencyReward, bankrupt, lines };
  return {
    ...state,
    day: state.day + 1,
    phase: bankrupt ? "defeat" : state.day + 1 >= VICTORY_DAY ? "victory" : "day",
    resources,
    lastSettlement: settlement,
    logs: [
      ...state.logs.slice(-80),
      { id: crypto.randomUUID(), day: state.day, phase: "settlement", text: lines.join(" / "), tone: bankrupt ? "danger" : "profit" },
    ],
  };
}
