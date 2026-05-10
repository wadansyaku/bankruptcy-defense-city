export type Phase = "day" | "night" | "settlement" | "victory" | "defeat";

export type ResourceKey =
  | "money"
  | "debt"
  | "interestRate"
  | "iron"
  | "scrap"
  | "ammo"
  | "fuel"
  | "power"
  | "population"
  | "happiness"
  | "taxRisk"
  | "research"
  | "gachaCurrency";

export type Resources = Record<ResourceKey, number>;

export type Biome = "ruinedIndustrial" | "swamp" | "housingRuins" | "wasteland" | "mountainResource";
export type Terrain = "plain" | "road" | "forest" | "water" | "rock" | "ironOre" | "oilField" | "scrapHeap";

export type BuildingKey =
  | "HQ"
  | "Road"
  | "Wall"
  | "GunTurret"
  | "LaserTurret"
  | "FlameTurret"
  | "Miner"
  | "Factory"
  | "PowerPlant"
  | "Battery"
  | "Conveyor"
  | "House"
  | "Shop"
  | "TaxOffice"
  | "LoanOffice";

export type EnemyKey =
  | "DebtCollector"
  | "TaxInspector"
  | "Rioter"
  | "CorporateSpy"
  | "ArmoredComplainer"
  | "BankruptcyTrusteeBoss";

export type TargetPriority = "nearest" | "lowestHp" | "highestThreat" | "closestToHQ";
export type CardRarity = "N" | "R" | "SR" | "UR";
export type CardCategory = "city" | "defense" | "economy" | "logistics" | "risk";

export interface Point {
  x: number;
  y: number;
}

export interface Tile extends Point {
  terrain: Terrain;
  biome: Biome;
  buildable: boolean;
  walkable: boolean;
  resource?: "iron" | "scrap" | "fuel";
  spawnId?: string;
  hqCandidate?: boolean;
}

export interface EnemySpawn extends Point {
  id: string;
  weight: number;
}

export interface HqCandidate extends Point {
  id: string;
  score: number;
}

export interface GameMap {
  seed: string;
  width: number;
  height: number;
  difficulty: "easy" | "normal" | "hard" | "bankruptcy";
  biomeBias: Biome;
  tiles: Tile[];
  spawns: EnemySpawn[];
  hqCandidates: HqCandidate[];
  verifiedPathable: boolean;
}

export interface BuildingDefinition {
  key: BuildingKey;
  nameJa: string;
  descriptionJa: string;
  cost: Partial<Resources>;
  upkeep: Partial<Resources>;
  produces: Partial<Resources>;
  maxHp: number;
  blocksPath: boolean;
  buildable: boolean;
  allowedTerrain: Terrain[];
  supply?: {
    requires?: Partial<Resources>;
    provides?: Partial<Resources>;
    storage?: Partial<Resources>;
    logisticRadius?: number;
  };
  attack?: {
    damage: number;
    range: number;
    intervalMs: number;
    consumes: Partial<Resources>;
    splashRadius?: number;
    priority: TargetPriority;
  };
}

export interface BuildingInstance extends Point {
  id: string;
  key: BuildingKey;
  hp: number;
  level: number;
  enabled: boolean;
  supplied: boolean;
  cooldownMs: number;
}

export interface EnemyDefinition {
  key: EnemyKey;
  nameJa: string;
  descriptionJa: string;
  maxHp: number;
  speedTilesPerSecond: number;
  damage: number;
  threat: number;
  preferredTargets: BuildingKey[];
  bounty: Partial<Resources>;
}

export interface EnemyInstance extends Point {
  id: string;
  key: EnemyKey;
  hp: number;
  path: Point[];
  pathIndex: number;
  progress: number;
  targetBuildingId?: string;
}

export interface CardEffect {
  resourceMultiplier?: Partial<Record<ResourceKey, number>>;
  buildingCostMultiplier?: Partial<Record<BuildingKey, number>>;
  enemySpawnMultiplier?: Partial<Record<EnemyKey, number>>;
  flatResourceDelta?: Partial<Resources>;
  towerDamageMultiplier?: number;
  logisticsSpeedMultiplier?: number;
  happinessDelta?: number;
  taxRiskDelta?: number;
  interestRateDelta?: number;
}

export interface CardDefinition {
  key: string;
  nameJa: string;
  rarity: CardRarity;
  descriptionJa: string;
  category: CardCategory;
  effects: CardEffect;
  flavorTextJa: string;
  artPrompt: string;
}

export interface WaveEntry {
  enemy: EnemyKey;
  count: number;
  intervalMs: number;
  spawnId?: string;
}

export interface WavePlan {
  day: number;
  entries: WaveEntry[];
}

export interface GameLogEntry {
  id: string;
  day: number;
  phase: Phase;
  text: string;
  tone: "info" | "profit" | "danger" | "absurd";
}

export interface SettlementResult {
  revenue: number;
  upkeep: number;
  interest: number;
  happinessDelta: number;
  taxRiskDelta: number;
  gachaCurrencyReward: number;
  bankrupt: boolean;
  lines: string[];
}

export interface GameState {
  version: 1;
  seed: string;
  map: GameMap;
  day: number;
  phase: Phase;
  resources: Resources;
  hqHp: number;
  debtLimit: number;
  buildings: BuildingInstance[];
  enemies: EnemyInstance[];
  selectedTile?: Point;
  selectedBuilding?: BuildingKey;
  lastSettlement?: SettlementResult;
  logs: GameLogEntry[];
  stats: {
    enemiesDefeated: number;
    buildingsPlaced: number;
    nightsSurvived: number;
  };
}

export interface SaveEnvelope {
  version: 1;
  savedAt: string;
  state: GameState;
}
