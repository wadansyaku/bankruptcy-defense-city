import { RESOURCE_KEYS, ZERO_RESOURCES } from "../../../shared/constants";
import type { Resources } from "../../../shared/gameTypes";

export function cloneResources(resources: Resources): Resources {
  return { ...resources };
}

export function emptyResources(): Resources {
  return { ...ZERO_RESOURCES };
}

export function addResources(base: Resources, delta: Partial<Resources>, multiplier = 1): Resources {
  const next = cloneResources(base);
  for (const key of RESOURCE_KEYS) {
    next[key] += (delta[key] ?? 0) * multiplier;
  }
  return clampResources(next);
}

export function canAfford(resources: Resources, cost: Partial<Resources>): boolean {
  return RESOURCE_KEYS.every((key) => resources[key] >= (cost[key] ?? 0));
}

export function spendResources(resources: Resources, cost: Partial<Resources>): Resources {
  if (!canAfford(resources, cost)) {
    throw new Error("資源が足りません");
  }
  return addResources(resources, cost, -1);
}

export function clampResources(resources: Resources): Resources {
  const next = cloneResources(resources);
  for (const key of RESOURCE_KEYS) {
    if (key === "interestRate") {
      next[key] = Math.max(0, Number(next[key].toFixed(4)));
    } else if (key === "happiness" || key === "taxRisk") {
      next[key] = Math.max(0, Math.min(100, Math.round(next[key])));
    } else {
      next[key] = Math.round(next[key]);
    }
  }
  return next;
}
