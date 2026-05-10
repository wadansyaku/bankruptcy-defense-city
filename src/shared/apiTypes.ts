export type ApiErrorCode =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "turnstile_required"
  | "validation_failed"
  | "internal_error";

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = {
  ok: false;
  error: { code: ApiErrorCode; message: string; details?: unknown };
};
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  createdAt: string;
};

export type UserProfile = {
  userId: string;
  username: string;
  displayName: string;
  avatarAssetKey: string | null;
  gachaCurrency: number;
  softCurrency: number;
  createdAt: string;
  updatedAt: string;
};

export type ClientConfig = {
  appEnv: string;
  turnstileSiteKey: string | null;
  turnstileRequired: boolean;
  codexImageModel: string;
  freeGachaDailyLimit: number;
};

export type SignupRequest = {
  email: string;
  password: string;
  name?: string;
  username?: string;
  displayName?: string;
  turnstileToken?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
  turnstileToken?: string;
};

export type UpdateProfileRequest = {
  name?: string;
  username?: string;
  displayName?: string;
  avatarAssetKey?: string | null;
};

export type GameSave = {
  id: string;
  slot: number;
  name: string;
  mapId: string;
  gameVersion: string;
  day: number;
  state: JsonValue;
  createdAt: string;
  updatedAt: string;
};

export type UpsertGameSaveRequest = {
  id?: string;
  slot?: number;
  name: string;
  mapId: string;
  gameVersion: string;
  day: number;
  state: JsonValue;
};

export type GeneratedMap = {
  id: string;
  name: string;
  seed: string;
  mapVersion: string;
  config: JsonValue;
  createdAt: string;
};

export type GachaRarity = "N" | "R" | "SR" | "UR";

export type GachaRateEntry = {
  itemKey: string;
  name: string;
  rarity: GachaRarity;
  weight: number;
  assetKey?: string | null;
  metadata?: JsonValue;
};

export type GachaBanner = {
  id: string;
  slug: string;
  title: string;
  cost: number;
  pityThreshold: number;
  rates: GachaRateEntry[];
  startsAt: string | null;
  endsAt: string | null;
};

export type GachaRollRequest = {
  bannerId: string;
  pullCount: 1 | 10;
  idempotencyKey: string;
  turnstileToken?: string;
};

export type GachaRollResult = {
  rollId: string;
  bannerId: string;
  pullCount: 1 | 10;
  cost: number;
  pityBefore: number;
  pityAfter: number;
  results: Array<Omit<GachaRateEntry, "weight">>;
  createdAt: string;
};

export type InventoryItem = {
  id: string;
  itemKey: string;
  rarity: GachaRarity;
  quantity: number;
  firstAcquiredAt: string;
  updatedAt: string;
};

export type AssetRecord = {
  id: string;
  key: string;
  r2Key: string;
  assetType: "card_art" | "avatar" | "map" | "ui";
  prompt: string | null;
  model: string | null;
  width: number | null;
  height: number | null;
  metadata: JsonValue;
  createdAt: string;
};

export type MeResponse = {
  user: AuthUser;
  profile: UserProfile;
};
