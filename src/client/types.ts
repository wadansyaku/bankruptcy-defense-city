export type RouteId =
  | "landing"
  | "login"
  | "signup"
  | "dashboard"
  | "map"
  | "game"
  | "gacha"
  | "inventory"
  | "settings";

export type GamePhase = "planning" | "night" | "result";

export type BuildingType = "shelter" | "market" | "watch" | "clinic";

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  mode: "guest" | "account";
  offline?: boolean;
}

export interface Building {
  id: string;
  type: BuildingType;
  x: number;
  y: number;
  level: number;
}

export interface CityState {
  id: string;
  seed: string;
  districtName: string;
  day: number;
  phase: GamePhase;
  funds: number;
  morale: number;
  debtPressure: number;
  cityHp: number;
  nightProgress: number;
  enemyVisible: boolean;
  enemyPressure: number;
  selectedBuilding: BuildingType;
  buildings: Building[];
  savedAt?: string;
}

export interface Card {
  id: string;
  name: string;
  rarity: "N" | "R" | "SR";
  effect: string;
  owned: number;
}

export interface TouchSettings {
  largeControls: boolean;
  confirmPlacement: boolean;
  reducedMotion: boolean;
  leftHandMode: boolean;
}

export interface AppSnapshot {
  version: 1;
  user: UserProfile;
  city: CityState;
  cards: Card[];
  settings: TouchSettings;
  pendingSync: boolean;
}

export interface AuthPayload {
  name?: string;
  email: string;
  password: string;
}

export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  offline?: boolean;
}
