import { ENEMY_DEFINITIONS } from "../../../shared/constants";
import type { EnemyDefinition, EnemyKey } from "../../../shared/gameTypes";

export const ENEMIES = Object.values(ENEMY_DEFINITIONS);

export function getEnemyDefinition(key: EnemyKey): EnemyDefinition {
  return ENEMY_DEFINITIONS[key];
}
