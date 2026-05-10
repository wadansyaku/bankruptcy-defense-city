import { BUILDING_DEFINITIONS } from "../../../shared/constants";
import type { BuildingDefinition, BuildingKey } from "../../../shared/gameTypes";

export const BUILDINGS = Object.values(BUILDING_DEFINITIONS);

export function getBuildingDefinition(key: BuildingKey): BuildingDefinition {
  return BUILDING_DEFINITIONS[key];
}
