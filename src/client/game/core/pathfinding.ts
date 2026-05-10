import { TERRAIN_MOVE_COST } from "../../../shared/constants";
import type { GameMap, Point, Tile } from "../../../shared/gameTypes";

export function pointKey(point: Point): string {
  return `${point.x},${point.y}`;
}

export function mapIndex(map: Pick<GameMap, "width" | "height">, point: Point): number {
  return point.y * map.width + point.x;
}

export function inBounds(map: Pick<GameMap, "width" | "height">, point: Point): boolean {
  return point.x >= 0 && point.y >= 0 && point.x < map.width && point.y < map.height;
}

export function getTile(map: GameMap, point: Point): Tile | undefined {
  return inBounds(map, point) ? map.tiles[mapIndex(map, point)] : undefined;
}

export function neighbors4(map: Pick<GameMap, "width" | "height">, point: Point): Point[] {
  return [
    { x: point.x + 1, y: point.y },
    { x: point.x - 1, y: point.y },
    { x: point.x, y: point.y + 1 },
    { x: point.x, y: point.y - 1 },
  ].filter((candidate) => inBounds(map, candidate));
}

export interface PathOptions {
  blocked?: ReadonlySet<string>;
  allowGoalBlocked?: boolean;
}

export function isTilePassable(tile: Tile): boolean {
  return tile.walkable && Number.isFinite(TERRAIN_MOVE_COST[tile.terrain]);
}

export function findPath(map: GameMap, start: Point, goal: Point, options: PathOptions = {}): Point[] {
  const startKey = pointKey(start);
  const goalKey = pointKey(goal);
  const open = new Set<string>([startKey]);
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>([[startKey, 0]]);
  const fScore = new Map<string, number>([[startKey, heuristic(start, goal)]]);
  const points = new Map<string, Point>([[startKey, start]]);

  while (open.size > 0) {
    const currentKey = lowest(open, fScore);
    const current = points.get(currentKey);
    if (!current) break;
    if (currentKey === goalKey) return reconstruct(cameFrom, points, currentKey);
    open.delete(currentKey);

    for (const neighbor of neighbors4(map, current)) {
      const key = pointKey(neighbor);
      const tile = getTile(map, neighbor);
      const isGoal = key === goalKey;
      if (!tile || (!isTilePassable(tile) && !(isGoal && options.allowGoalBlocked))) continue;
      if (options.blocked?.has(key) && !(isGoal && options.allowGoalBlocked)) continue;

      const tentative = (gScore.get(currentKey) ?? Number.POSITIVE_INFINITY) + TERRAIN_MOVE_COST[tile.terrain];
      if (tentative < (gScore.get(key) ?? Number.POSITIVE_INFINITY)) {
        points.set(key, neighbor);
        cameFrom.set(key, currentKey);
        gScore.set(key, tentative);
        fScore.set(key, tentative + heuristic(neighbor, goal));
        open.add(key);
      }
    }
  }

  return [];
}

function heuristic(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function lowest(open: ReadonlySet<string>, scores: ReadonlyMap<string, number>): string {
  let best = "";
  let bestScore = Number.POSITIVE_INFINITY;
  for (const key of open) {
    const score = scores.get(key) ?? Number.POSITIVE_INFINITY;
    if (score < bestScore) {
      best = key;
      bestScore = score;
    }
  }
  return best;
}

function reconstruct(cameFrom: ReadonlyMap<string, string>, points: ReadonlyMap<string, Point>, endKey: string): Point[] {
  const path: Point[] = [];
  let cursor = endKey;
  while (true) {
    const point = points.get(cursor);
    if (!point) break;
    path.unshift(point);
    const next = cameFrom.get(cursor);
    if (!next) break;
    cursor = next;
  }
  return path;
}
