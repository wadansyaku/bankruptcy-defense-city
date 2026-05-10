import { BUILDING_DEFINITIONS, STARTING_RESOURCES } from "../../../shared/constants";
import type { BuildingInstance, BuildingKey, GameLogEntry, GameState, Point } from "../../../shared/gameTypes";
import { canPlaceWithoutBlocking, spawnEnemy, stepCombat } from "./combat";
import { settleDay } from "./economy";
import { generateMap, type MapGenerationOptions } from "./mapgen";
import { getTile, pointKey } from "./pathfinding";
import { canAfford, spendResources } from "./resources";
import { createWavePlan, flattenWave } from "./waves";
import { computeSupply } from "./logistics";

export function createInitialGame(seed = "hasan-default", options: MapGenerationOptions = {}): GameState {
  const map = generateMap(seed, options);
  const hqPoint = map.hqCandidates[0];
  const hq: BuildingInstance = {
    id: "hq",
    key: "HQ",
    x: hqPoint.x,
    y: hqPoint.y,
    hp: BUILDING_DEFINITIONS.HQ.maxHp,
    level: 1,
    enabled: true,
    supplied: true,
    cooldownMs: 0,
  };
  const starterRoads = [
    { x: hq.x - 1, y: hq.y },
    { x: hq.x + 1, y: hq.y },
    { x: hq.x, y: hq.y - 1 },
    { x: hq.x, y: hq.y + 1 },
  ].map((point, index) => building(`starter-road-${index}`, "Road", point));

  return {
    version: 1,
    seed,
    map,
    day: 1,
    phase: "day",
    resources: { ...STARTING_RESOURCES },
    hqHp: hq.hp,
    debtLimit: 9000,
    buildings: [hq, ...starterRoads],
    enemies: [],
    selectedBuilding: "GunTurret",
    logs: [log(1, "day", "破産防衛都市へようこそ。まずは本社を守り、帳簿を見なかったことにしましょう。", "absurd")],
    stats: { enemiesDefeated: 0, buildingsPlaced: 0, nightsSurvived: 0 },
  };
}

export function placeBuilding(state: GameState, key: BuildingKey, point: Point): GameState {
  const definition = BUILDING_DEFINITIONS[key];
  const tile = getTile(state.map, point);
  if (!definition.buildable || !tile || !tile.buildable || !definition.allowedTerrain.includes(tile.terrain)) {
    return addLog(state, `${definition.nameJa} はその土地に置けません。行政より厳しい判定です。`, "danger");
  }
  if (state.buildings.some((buildingInstance) => buildingInstance.x === point.x && buildingInstance.y === point.y)) {
    return addLog(state, "その場所には既に何かあります。だいたい問題もあります。", "danger");
  }
  if (!canAfford(state.resources, definition.cost)) {
    return addLog(state, `${definition.nameJa} の資金または資源が足りません。闇金融は設定画面ではなく建設パネルです。`, "danger");
  }
  if (definition.blocksPath && !canPlaceWithoutBlocking(state, point)) {
    return addLog(state, "経路完全封鎖は監査対象です。敵にも通勤の自由があります。", "danger");
  }
  const next: GameState = {
    ...state,
    resources: spendResources(state.resources, definition.cost),
    buildings: [...state.buildings, building(`building-${crypto.randomUUID()}`, key, point)],
    stats: { ...state.stats, buildingsPlaced: state.stats.buildingsPlaced + 1 },
  };
  return updateSupply(addLog(next, `${definition.nameJa} を建設しました。`, "info"));
}

export function startNight(state: GameState): GameState {
  if (state.phase !== "day") return state;
  let next = addLog({ ...state, phase: "night", enemies: [] }, "夜を開始。督促の足音が聞こえます。", "danger");
  const queue = flattenWave(createWavePlan(state.day, state));
  queue.forEach((enemy, index) => {
    next = spawnEnemy(next, enemy, index);
  });
  return updateSupply(next);
}

export function finishSettlement(state: GameState): GameState {
  if (state.phase === "defeat" || state.phase === "victory") return state;
  return updateSupply(settleDay({ ...state, phase: "settlement", enemies: [] }));
}

export function stepGame(state: GameState, deltaMs: number): GameState {
  if (state.phase !== "night") return state;
  const next = updateSupply(stepCombat(state, deltaMs));
  if (next.phase === "defeat") return addLog(next, "本社HPが0になりました。破産管財人が椅子を温めています。", "danger");
  if (next.enemies.length === 0) {
    return addLog(
      { ...next, phase: "settlement", stats: { ...next.stats, nightsSurvived: next.stats.nightsSurvived + 1 } },
      "夜を生き延びました。決算という名の第二波が来ます。",
      "profit",
    );
  }
  return next;
}

export function selectTile(state: GameState, point: Point): GameState {
  return { ...state, selectedTile: point };
}

export function selectBuilding(state: GameState, key: BuildingKey): GameState {
  return { ...state, selectedBuilding: key };
}

export function renderGameToText(state: GameState): string {
  const hq = state.buildings.find((b) => b.key === "HQ");
  return JSON.stringify({
    coordinate: "origin top-left, x right, y down, tile units",
    phase: state.phase,
    day: state.day,
    hq: hq ? { x: hq.x, y: hq.y, hp: state.hqHp } : null,
    resources: state.resources,
    enemies: state.enemies.slice(0, 12).map((enemy) => ({ key: enemy.key, x: enemy.x, y: enemy.y, hp: enemy.hp })),
    buildings: state.buildings.map((b) => ({ key: b.key, x: b.x, y: b.y, supplied: b.supplied })),
    selectedTile: state.selectedTile,
    log: state.logs.slice(-3).map((entry) => entry.text),
  });
}

function building(id: string, key: BuildingKey, point: Point): BuildingInstance {
  return {
    id,
    key,
    x: point.x,
    y: point.y,
    hp: BUILDING_DEFINITIONS[key].maxHp,
    level: 1,
    enabled: true,
    supplied: true,
    cooldownMs: 0,
  };
}

function updateSupply(state: GameState): GameState {
  const report = computeSupply(state.buildings, state.resources);
  const buildings = state.buildings.map((buildingInstance) => ({
    ...buildingInstance,
    supplied: report.suppliedBuildingIds.has(buildingInstance.id),
  }));
  const shortageLogs = report.shortages.slice(0, 2).map((text) => log(state.day, state.phase, text, "danger"));
  return { ...state, buildings, logs: [...state.logs, ...shortageLogs].slice(-100) };
}

function addLog(state: GameState, text: string, tone: GameLogEntry["tone"]): GameState {
  return { ...state, logs: [...state.logs, log(state.day, state.phase, text, tone)].slice(-100) };
}

function log(day: number, phase: GameState["phase"], text: string, tone: GameLogEntry["tone"]): GameLogEntry {
  return { id: `log-${crypto.randomUUID()}`, day, phase, text, tone };
}

export function occupiedSet(buildings: BuildingInstance[]): Set<string> {
  return new Set(buildings.map((buildingInstance) => pointKey(buildingInstance)));
}
