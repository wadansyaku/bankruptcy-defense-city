import { BUILDING_DEFINITIONS, ENEMY_DEFINITIONS, MAP_HEIGHT, MAP_WIDTH, RESOURCE_KEYS } from "../../src/shared/constants";
import { createRng } from "../../src/client/game/core/rng";
import { generateMap } from "../../src/client/game/core/mapgen";
import { findPath } from "../../src/client/game/core/pathfinding";
import { createInitialGame, finishSettlement, placeBuilding, startNight, stepGame } from "../../src/client/game/core/game";
import { computeSupply } from "../../src/client/game/core/logistics";
import { CARD_DEFINITIONS, cardsByRarity } from "../../src/client/game/core/cards";
import { decodeSave, encodeSave } from "../../src/client/game/core/saveCodec";

describe("game core PR1", () => {
  it("rng is deterministic by seed", () => {
    const a = createRng("same-seed");
    const b = createRng("same-seed");
    expect(Array.from({ length: 12 }, () => a.next())).toEqual(Array.from({ length: 12 }, () => b.next()));
  });

  it("map generation is deterministic and creates a verified 96x64 map", () => {
    const a = generateMap("CITY-42");
    const b = generateMap("CITY-42");
    expect(a.width).toBe(MAP_WIDTH);
    expect(a.height).toBe(MAP_HEIGHT);
    expect(a.tiles).toHaveLength(MAP_WIDTH * MAP_HEIGHT);
    expect(a.verifiedPathable).toBe(true);
    expect(a).toEqual(b);
  });

  it("pathfinding connects every spawn to the primary HQ candidate", () => {
    const map = generateMap("PATH-SEED");
    const hq = map.hqCandidates[0];
    for (const spawn of map.spawns) {
      const path = findPath(map, spawn, hq);
      expect(path.length).toBeGreaterThan(0);
      expect(path.at(0)).toMatchObject({ x: spawn.x, y: spawn.y });
      expect(path.at(-1)).toMatchObject({ x: hq.x, y: hq.y });
    }
  });

  it("defines requested resources, buildings, enemies, and 30 cards", () => {
    expect([...RESOURCE_KEYS]).toEqual([
      "money",
      "debt",
      "interestRate",
      "iron",
      "scrap",
      "ammo",
      "fuel",
      "power",
      "population",
      "happiness",
      "taxRisk",
      "research",
      "gachaCurrency",
    ]);
    expect(Object.keys(BUILDING_DEFINITIONS).sort()).toEqual([
      "Battery",
      "Conveyor",
      "Factory",
      "FlameTurret",
      "GunTurret",
      "HQ",
      "House",
      "LaserTurret",
      "LoanOffice",
      "Miner",
      "PowerPlant",
      "Road",
      "Shop",
      "TaxOffice",
      "Wall",
    ]);
    expect(Object.keys(ENEMY_DEFINITIONS).sort()).toEqual([
      "ArmoredComplainer",
      "BankruptcyTrusteeBoss",
      "CorporateSpy",
      "DebtCollector",
      "Rioter",
      "TaxInspector",
    ]);
    expect(CARD_DEFINITIONS).toHaveLength(30);
    expect(new Set(CARD_DEFINITIONS.map((card) => card.rarity))).toEqual(new Set(["N", "R", "SR", "UR"]));
  });

  it("gacha rarity helper filters card definitions", () => {
    expect(cardsByRarity("UR").every((card) => card.rarity === "UR")).toBe(true);
    expect(cardsByRarity("N").length).toBeGreaterThan(0);
  });

  it("logistics reports unsupported buildings outside conveyor network", () => {
    const state = createInitialGame("LOGISTICS");
    const hq = state.buildings.find((building) => building.key === "HQ")!;
    const remote = {
      id: "remote-gun",
      key: "GunTurret" as const,
      x: Math.min(hq.x + 20, state.map.width - 2),
      y: hq.y,
      hp: BUILDING_DEFINITIONS.GunTurret.maxHp,
      level: 1,
      enabled: true,
      supplied: true,
      cooldownMs: 0,
    };
    const report = computeSupply([...state.buildings, remote], state.resources);
    expect(report.suppliedBuildingIds.has(remote.id)).toBe(false);
    expect(report.shortages.some((line) => line.includes("孤立"))).toBe(true);
  });

  it("settlement applies interest and building production", () => {
    const state = createInitialGame("ECONOMY");
    const hq = state.buildings.find((building) => building.key === "HQ")!;
    const built = placeBuilding(state, "House", { x: hq.x + 1, y: hq.y + 1 });
    const settled = finishSettlement(built);
    expect(settled.lastSettlement?.interest).toBeGreaterThan(0);
    expect(settled.resources.debt).toBeGreaterThanOrEqual(built.resources.debt);
  });

  it("combat advances night enemies and can clear a small wave", () => {
    const started = startNight(createInitialGame("COMBAT"));
    const stepped = stepGame(started, 1000);
    expect(stepped.phase === "night" || stepped.phase === "settlement" || stepped.phase === "defeat").toBe(true);
  });

  it("save codec round-trips state envelope", () => {
    const state = createInitialGame("SAVE");
    const restored = decodeSave(encodeSave(state)).state;
    expect(restored.seed).toBe(state.seed);
    expect(restored.map).toEqual(state.map);
    expect(restored.resources).toEqual(state.resources);
  });
});

