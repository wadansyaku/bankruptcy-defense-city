import { BUILDING_DEFINITIONS } from "../../../shared/constants";
import type { BuildingInstance, Resources } from "../../../shared/gameTypes";

export interface SupplyReport {
  suppliedBuildingIds: Set<string>;
  shortages: string[];
}

export function computeSupply(buildings: BuildingInstance[], resources: Resources): SupplyReport {
  const suppliedBuildingIds = new Set<string>();
  const shortages: string[] = [];
  const conveyors = buildings.filter((building) => building.key === "Conveyor");

  for (const building of buildings) {
    const definition = BUILDING_DEFINITIONS[building.key];
    const requires = definition.supply?.requires ?? definition.attack?.consumes ?? {};
    const nearNetwork =
      definition.key === "HQ" ||
      definition.key === "Road" ||
      definition.key === "Conveyor" ||
      conveyors.some((conveyor) => Math.hypot(conveyor.x - building.x, conveyor.y - building.y) <= 6);
    const hasResources = Object.entries(requires).every(([key, amount]) => resources[key as keyof Resources] >= (amount ?? 0));
    if (nearNetwork && hasResources) {
      suppliedBuildingIds.add(building.id);
    } else if (!hasResources) {
      shortages.push(`${definition.nameJa}: 供給資源が不足`);
    } else {
      shortages.push(`${definition.nameJa}: コンベア網から孤立`);
    }
  }

  return { suppliedBuildingIds, shortages };
}
