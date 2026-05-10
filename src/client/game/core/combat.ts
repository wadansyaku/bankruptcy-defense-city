import { BUILDING_DEFINITIONS, ENEMY_DEFINITIONS } from "../../../shared/constants";
import type { BuildingInstance, EnemyInstance, GameState, Point } from "../../../shared/gameTypes";
import { findPath, pointKey } from "./pathfinding";
import { addResources, canAfford } from "./resources";

export function spawnEnemy(state: GameState, key: EnemyInstance["key"], spawnIndex: number): GameState {
  const spawn = state.map.spawns[spawnIndex % state.map.spawns.length];
  const hq = state.buildings.find((building) => building.key === "HQ") ?? state.buildings[0];
  const blocked = blockedTiles(state.buildings, hq.id);
  const path = findPath(state.map, spawn, hq, { blocked, allowGoalBlocked: true });
  const definition = ENEMY_DEFINITIONS[key];
  const debtScale = key === "BankruptcyTrusteeBoss" ? 1 + state.resources.debt / 10_000 : 1;
  const enemy: EnemyInstance = {
    id: `enemy-${crypto.randomUUID()}`,
    key,
    x: spawn.x,
    y: spawn.y,
    hp: Math.round(definition.maxHp * debtScale),
    path,
    pathIndex: 0,
    progress: 0,
  };
  return { ...state, enemies: [...state.enemies, enemy] };
}

export function stepCombat(state: GameState, deltaMs: number): GameState {
  if (state.phase !== "night") return state;
  let resources = { ...state.resources };
  let hqHp = state.hqHp;
  let enemies = state.enemies.map((enemy) => moveEnemy(enemy, deltaMs));
  const buildings = state.buildings.map((building) => ({ ...building, cooldownMs: Math.max(0, building.cooldownMs - deltaMs) }));
  let defeated = 0;

  for (const building of buildings) {
    const definition = BUILDING_DEFINITIONS[building.key];
    if (!definition.attack || building.hp <= 0 || !building.enabled || !building.supplied || building.cooldownMs > 0) continue;
    if (!canAfford(resources, definition.attack.consumes)) {
      building.supplied = false;
      continue;
    }
    const target = pickTarget(building, enemies, definition.attack.range);
    if (!target) continue;
    resources = addResources(resources, definition.attack.consumes, -1);
    building.cooldownMs = definition.attack.intervalMs;
    enemies = enemies.map((enemy) => {
      const dist = Math.hypot(enemy.x - target.x, enemy.y - target.y);
      const splash = definition.attack?.splashRadius ?? 0;
      return enemy.id === target.id || dist <= splash ? { ...enemy, hp: enemy.hp - definition.attack!.damage } : enemy;
    });
  }

  const survivors: EnemyInstance[] = [];
  for (const enemy of enemies) {
    if (enemy.hp <= 0) {
      defeated += 1;
      resources = addResources(resources, ENEMY_DEFINITIONS[enemy.key].bounty);
      continue;
    }
    if (enemy.pathIndex >= enemy.path.length - 1) {
      hqHp -= ENEMY_DEFINITIONS[enemy.key].damage;
      continue;
    }
    survivors.push(enemy);
  }

  return {
    ...state,
    hqHp,
    phase: hqHp <= 0 ? "defeat" : state.phase,
    resources,
    buildings,
    enemies: survivors,
    stats: { ...state.stats, enemiesDefeated: state.stats.enemiesDefeated + defeated },
  };
}

function moveEnemy(enemy: EnemyInstance, deltaMs: number): EnemyInstance {
  const definition = ENEMY_DEFINITIONS[enemy.key];
  if (enemy.path.length === 0 || enemy.pathIndex >= enemy.path.length - 1) return enemy;
  const progress = enemy.progress + (definition.speedTilesPerSecond * deltaMs) / 1000;
  if (progress < 1) return { ...enemy, progress };
  const nextIndex = Math.min(enemy.pathIndex + 1, enemy.path.length - 1);
  const point = enemy.path[nextIndex];
  return { ...enemy, x: point.x, y: point.y, pathIndex: nextIndex, progress: progress - 1 };
}

function pickTarget(building: BuildingInstance, enemies: EnemyInstance[], range: number): EnemyInstance | undefined {
  return enemies
    .filter((enemy) => Math.hypot(enemy.x - building.x, enemy.y - building.y) <= range)
    .sort((a, b) => {
      const da = Math.hypot(a.x - building.x, a.y - building.y);
      const db = Math.hypot(b.x - building.x, b.y - building.y);
      return da - db;
    })[0];
}

function blockedTiles(buildings: BuildingInstance[], goalBuildingId: string): Set<string> {
  return new Set(
    buildings
      .filter((building) => BUILDING_DEFINITIONS[building.key].blocksPath && building.id !== goalBuildingId && building.hp > 0)
      .map((building) => pointKey(building)),
  );
}

export function canPlaceWithoutBlocking(state: GameState, point: Point): boolean {
  const hq = state.buildings.find((building) => building.key === "HQ");
  if (!hq) return true;
  const blocked = blockedTiles([...state.buildings, { id: "candidate", key: "Wall", x: point.x, y: point.y, hp: 1, level: 1, enabled: true, supplied: true, cooldownMs: 0 }], hq.id);
  return state.map.spawns.every((spawn) => findPath(state.map, spawn, hq, { blocked, allowGoalBlocked: true }).length > 0);
}
