import { BIOMES, MAP_HEIGHT, MAP_WIDTH } from "../../../shared/constants";
import type { Biome, EnemySpawn, GameMap, HqCandidate, Point, Terrain, Tile } from "../../../shared/gameTypes";
import { findPath, mapIndex } from "./pathfinding";
import { createRng, deterministicNoise } from "./rng";

export interface MapGenerationOptions {
  width?: number;
  height?: number;
  difficulty?: GameMap["difficulty"];
  biomeBias?: Biome;
}

export function generateMap(seed: string, options: MapGenerationOptions = {}): GameMap {
  const width = options.width ?? MAP_WIDTH;
  const height = options.height ?? MAP_HEIGHT;
  const biomeBias = options.biomeBias ?? BIOMES[createRng(seed).int(0, BIOMES.length - 1)];
  const difficulty = options.difficulty ?? "normal";
  const tiles: Tile[] = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const biome = pickBiome(seed, x, y, width, height, biomeBias);
      const terrain = pickTerrain(seed, x, y, biome);
      tiles.push({
        x,
        y,
        biome,
        terrain,
        buildable: !["water", "rock"].includes(terrain),
        walkable: !["water", "rock"].includes(terrain),
        resource: terrain === "ironOre" ? "iron" : terrain === "scrapHeap" ? "scrap" : terrain === "oilField" ? "fuel" : undefined,
      });
    }
  }

  const hqCandidates = buildHqCandidates(seed, width, height);
  const hq = hqCandidates[0];
  const spawns = buildSpawns(seed, width, height);

  for (const spawn of spawns) {
    carveRoad(tiles, width, spawn, hq, createRng(`${seed}:${spawn.id}`).bool(0.5));
  }
  for (const candidate of hqCandidates) patchTile(tiles, width, candidate, { hqCandidate: true, terrain: "plain", walkable: true, buildable: true });
  for (const spawn of spawns) patchTile(tiles, width, spawn, { spawnId: spawn.id, terrain: "road", walkable: true, buildable: true });

  const map: GameMap = { seed, width, height, difficulty, biomeBias, tiles, spawns, hqCandidates, verifiedPathable: false };
  return { ...map, verifiedPathable: spawns.every((spawn) => findPath(map, spawn, hq).length > 0) };
}

function pickBiome(seed: string, x: number, y: number, width: number, height: number, bias: Biome): Biome {
  const center = 1 - Math.min(1, Math.hypot(x - width / 2, y - height / 2) / Math.max(width, height));
  if (center > 0.78) return "housingRuins";
  const roll = deterministicNoise(seed, Math.floor(x / 12), Math.floor(y / 12), "biome");
  if (roll < 0.24) return bias;
  if (roll < 0.42) return "ruinedIndustrial";
  if (roll < 0.58) return "swamp";
  if (roll < 0.76) return "wasteland";
  return "mountainResource";
}

function pickTerrain(seed: string, x: number, y: number, biome: Biome): Terrain {
  const elevation = layeredNoise(seed, x, y, "elevation");
  const moisture = layeredNoise(seed, x, y, "moisture");
  const resource = deterministicNoise(seed, x, y, "resource");
  if (biome === "swamp" && moisture > 0.72) return "water";
  if (biome === "mountainResource" && elevation > 0.74) return "rock";
  if ((biome === "mountainResource" || biome === "ruinedIndustrial") && resource > 0.86) return "ironOre";
  if ((biome === "ruinedIndustrial" || biome === "housingRuins") && resource > 0.78) return "scrapHeap";
  if ((biome === "wasteland" || biome === "swamp") && resource < 0.08) return "oilField";
  if (moisture > 0.58) return "forest";
  return "plain";
}

function layeredNoise(seed: string, x: number, y: number, salt: string): number {
  return (
    deterministicNoise(seed, Math.floor(x / 9), Math.floor(y / 9), `${salt}:coarse`) * 0.5 +
    deterministicNoise(seed, Math.floor(x / 4), Math.floor(y / 4), `${salt}:mid`) * 0.3 +
    deterministicNoise(seed, x, y, `${salt}:fine`) * 0.2
  );
}

function buildHqCandidates(seed: string, width: number, height: number): HqCandidate[] {
  const rng = createRng(`hq:${seed}`);
  const center = { x: Math.floor(width / 2), y: Math.floor(height / 2) };
  return Array.from({ length: 5 }, (_, index) => {
    const point = { x: clamp(center.x + rng.int(-9, 9), 6, width - 7), y: clamp(center.y + rng.int(-7, 7), 6, height - 7) };
    return { id: `hq-${index + 1}`, ...point, score: Math.round(100 - Math.hypot(point.x - center.x, point.y - center.y) * 4) };
  }).sort((a, b) => b.score - a.score);
}

function buildSpawns(seed: string, width: number, height: number): EnemySpawn[] {
  const rng = createRng(`spawns:${seed}`);
  return [
    { id: "north", x: rng.int(6, width - 7), y: 1, weight: 1 },
    { id: "south", x: rng.int(6, width - 7), y: height - 2, weight: 1 },
    { id: "west", x: 1, y: rng.int(6, height - 7), weight: 1 },
    { id: "east", x: width - 2, y: rng.int(6, height - 7), weight: 1 },
  ];
}

function carveRoad(tiles: Tile[], width: number, from: Point, to: Point, horizontalFirst: boolean): void {
  const cursor = { ...from };
  const moveX = (): void => {
    const step = cursor.x <= to.x ? 1 : -1;
    while (cursor.x !== to.x) {
      cursor.x += step;
      patchTile(tiles, width, cursor, { terrain: "road", walkable: true, buildable: true });
    }
  };
  const moveY = (): void => {
    const step = cursor.y <= to.y ? 1 : -1;
    while (cursor.y !== to.y) {
      cursor.y += step;
      patchTile(tiles, width, cursor, { terrain: "road", walkable: true, buildable: true });
    }
  };
  if (horizontalFirst) {
    moveX();
    moveY();
  } else {
    moveY();
    moveX();
  }
}

function patchTile(tiles: Tile[], width: number, point: Point, patch: Partial<Tile>): void {
  const index = mapIndex({ width, height: Number.MAX_SAFE_INTEGER } as GameMap, point);
  tiles[index] = { ...tiles[index], ...patch };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
