import type {
  AssetRecord,
  AuthUser,
  GachaBanner,
  GachaRateEntry,
  GachaRollResult,
  GeneratedMap,
  InventoryItem,
  UserProfile,
} from "../shared/apiTypes";
import { randomId } from "./crypto";
import type { AuditAction, SqlValue } from "./types";

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
  disabled_at: string | null;
};

type UserProfileRow = {
  user_id: string;
  username: string;
  display_name: string;
  avatar_asset_key: string | null;
  soft_currency: number;
  gacha_currency: number;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

type SessionUserRow = UserRow & {
  session_id: string;
  expires_at: string;
  username: string;
  display_name: string;
  avatar_asset_key: string | null;
  soft_currency: number;
  gacha_currency: number;
  profile_created_at: string;
  profile_updated_at: string;
};

type GameSaveRow = {
  id: string;
  slot: number;
  name: string;
  map_id: string;
  game_version: string;
  day: number;
  state_json: string;
  created_at: string;
  updated_at: string;
};

type GeneratedMapRow = {
  id: string;
  name: string;
  seed: string;
  map_version: string;
  config_json: string;
  created_at: string;
};

type GachaBannerRow = {
  id: string;
  slug: string;
  title: string;
  cost: number;
  pity_threshold: number;
  rates_json: string;
  starts_at: string | null;
  ends_at: string | null;
};

type GachaRollRow = {
  id: string;
  banner_id: string;
  pull_count: 1 | 10;
  cost: number;
  pity_before: number;
  pity_after: number;
  result_json: string;
  created_at: string;
};

type InventoryItemRow = {
  id: string;
  item_key: string;
  rarity: InventoryItem["rarity"];
  quantity: number;
  first_acquired_at: string;
  updated_at: string;
};

type AssetRecordRow = {
  id: string;
  key: string;
  r2_key: string;
  asset_type: AssetRecord["assetType"];
  prompt: string | null;
  model: string | null;
  width: number | null;
  height: number | null;
  metadata_json: string;
  created_at: string;
};

export class SqlDatabase {
  constructor(private readonly db: D1Database) {}

  async first<T>(sql: string, ...params: SqlValue[]): Promise<T | null> {
    const row = await this.db.prepare(sql).bind(...params).first<T>();
    return row ?? null;
  }

  async all<T>(sql: string, ...params: SqlValue[]): Promise<T[]> {
    const result = await this.db.prepare(sql).bind(...params).all<T>();
    return result.results ?? [];
  }

  async run(sql: string, ...params: SqlValue[]): Promise<D1Result> {
    return this.db.prepare(sql).bind(...params).run();
  }

  async createUser(input: {
    id: string;
    email: string;
    passwordHash: string;
    username: string;
    displayName: string;
    now: string;
    initialGachaCurrency: number;
  }): Promise<void> {
    await this.db.batch([
      this.db
        .prepare(
          "INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)",
        )
        .bind(input.id, input.email, input.passwordHash, input.now),
      this.db
        .prepare(
          `INSERT INTO user_profiles
             (user_id, username, display_name, soft_currency, gacha_currency, created_at, updated_at)
           VALUES (?1, ?2, ?3, ?4, ?4, ?5, ?5)`,
        )
        .bind(input.id, input.username, input.displayName, input.initialGachaCurrency, input.now),
    ]);
  }

  async findUserByEmail(email: string): Promise<(UserRow & UserProfileRow) | null> {
    return this.first<UserRow & UserProfileRow>(
      `SELECT u.*, p.user_id, p.username, p.display_name, p.avatar_asset_key, p.soft_currency, p.gacha_currency,
              p.created_at AS profile_created_at, p.updated_at AS profile_updated_at
       FROM users u
       JOIN user_profiles p ON p.user_id = u.id
       WHERE u.email = ?1`,
      email,
    );
  }

  async findSessionByTokenHash(tokenHash: string, now: string): Promise<SessionUserRow | null> {
    return this.first<SessionUserRow>(
      `SELECT
         s.id AS session_id,
         s.expires_at,
         u.id,
         u.email,
         u.password_hash,
         u.created_at,
         u.updated_at,
         u.disabled_at,
         p.username,
         p.display_name,
         p.avatar_asset_key,
         p.soft_currency,
         p.gacha_currency,
         p.created_at AS profile_created_at,
         p.updated_at AS profile_updated_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       JOIN user_profiles p ON p.user_id = u.id
       WHERE s.token_hash = ?1
         AND s.revoked_at IS NULL
         AND s.expires_at > ?2
         AND u.disabled_at IS NULL`,
      tokenHash,
      now,
    );
  }

  async createSession(input: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: string;
    now: string;
    userAgent: string | null;
    ipHash: string | null;
  }): Promise<void> {
    await this.run(
      `INSERT INTO sessions
         (id, user_id, token_hash, expires_at, user_agent, ip_hash, created_at, last_seen_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7)`,
      input.id,
      input.userId,
      input.tokenHash,
      input.expiresAt,
      input.userAgent,
      input.ipHash,
      input.now,
    );
  }

  async touchSession(sessionId: string, now: string): Promise<void> {
    await this.run("UPDATE sessions SET last_seen_at = ?1 WHERE id = ?2", now, sessionId);
  }

  async revokeSession(sessionId: string, now: string): Promise<void> {
    await this.run("UPDATE sessions SET revoked_at = ?1 WHERE id = ?2", now, sessionId);
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const row = await this.first<UserProfileRow>("SELECT * FROM user_profiles WHERE user_id = ?1", userId);
    return row ? toUserProfile(row) : null;
  }

  async updateProfile(input: {
    userId: string;
    username?: string;
    displayName?: string;
    avatarAssetKey?: string | null;
    now: string;
  }): Promise<UserProfile | null> {
    const current = await this.getProfile(input.userId);
    if (!current) {
      return null;
    }

    await this.run(
      `UPDATE user_profiles
       SET username = ?1, display_name = ?2, avatar_asset_key = ?3, updated_at = ?4
       WHERE user_id = ?5`,
      input.username ?? current.username,
      input.displayName ?? current.displayName,
      input.avatarAssetKey === undefined ? current.avatarAssetKey : input.avatarAssetKey,
      input.now,
      input.userId,
    );

    return this.getProfile(input.userId);
  }

  async listGameSaves(userId: string): Promise<ReturnType<typeof toGameSave>[]> {
    const rows = await this.all<GameSaveRow>(
      "SELECT * FROM game_saves WHERE user_id = ?1 ORDER BY updated_at DESC",
      userId,
    );
    return rows.map(toGameSave);
  }

  async getGameSave(userId: string, id: string): Promise<ReturnType<typeof toGameSave> | null> {
    const row = await this.first<GameSaveRow>(
      "SELECT * FROM game_saves WHERE user_id = ?1 AND id = ?2",
      userId,
      id,
    );
    return row ? toGameSave(row) : null;
  }

  async upsertGameSave(input: {
    id?: string;
    userId: string;
    slot?: number;
    name: string;
    mapId: string;
    gameVersion: string;
    day: number;
    state: unknown;
    now: string;
  }): Promise<ReturnType<typeof toGameSave>> {
    const id = input.id ?? randomId("save");
    await this.run(
      `INSERT INTO game_saves
         (id, user_id, slot, name, map_id, game_version, day, state_json, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?9)
       ON CONFLICT(id, user_id) DO UPDATE SET
         slot = excluded.slot,
         name = excluded.name,
         map_id = excluded.map_id,
         game_version = excluded.game_version,
         day = excluded.day,
         state_json = excluded.state_json,
         updated_at = excluded.updated_at`,
      id,
      input.userId,
      input.slot ?? 1,
      input.name,
      input.mapId,
      input.gameVersion,
      input.day,
      JSON.stringify(input.state),
      input.now,
    );

    const row = await this.first<GameSaveRow>(
      "SELECT * FROM game_saves WHERE id = ?1 AND user_id = ?2",
      id,
      input.userId,
    );
    if (!row) {
      throw new Error("game_saves upsert did not return a row");
    }
    return toGameSave(row);
  }

  async deleteGameSave(userId: string, id: string): Promise<boolean> {
    const result = await this.run("DELETE FROM game_saves WHERE user_id = ?1 AND id = ?2", userId, id);
    return (result.meta.changes ?? 0) > 0;
  }

  async listGeneratedMaps(): Promise<GeneratedMap[]> {
    const rows = await this.all<GeneratedMapRow>("SELECT * FROM generated_maps ORDER BY created_at DESC");
    return rows.map(toGeneratedMap);
  }

  async getGeneratedMap(id: string): Promise<GeneratedMap | null> {
    const row = await this.first<GeneratedMapRow>("SELECT * FROM generated_maps WHERE id = ?1", id);
    return row ? toGeneratedMap(row) : null;
  }

  async createGeneratedMap(input: {
    id: string;
    userId: string;
    name: string;
    seed: string;
    mapVersion: string;
    config: unknown;
    now: string;
  }): Promise<GeneratedMap> {
    await this.run(
      `INSERT INTO generated_maps (id, user_id, name, seed, map_version, config_json, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
      input.id,
      input.userId,
      input.name,
      input.seed,
      input.mapVersion,
      JSON.stringify(input.config),
      input.now,
    );
    const created = await this.getGeneratedMap(input.id);
    if (!created) {
      throw new Error("generated_maps insert did not return a row");
    }
    return created;
  }

  async listActiveBanners(now: string): Promise<GachaBanner[]> {
    const rows = await this.all<GachaBannerRow>(
      `SELECT * FROM gacha_banners
       WHERE is_active = 1
         AND (starts_at IS NULL OR starts_at <= ?1)
         AND (ends_at IS NULL OR ends_at > ?1)
       ORDER BY starts_at ASC, created_at ASC`,
      now,
    );
    return rows.map(toGachaBanner);
  }

  async getBanner(bannerId: string, now: string): Promise<GachaBanner | null> {
    const row = await this.first<GachaBannerRow>(
      `SELECT * FROM gacha_banners
       WHERE id = ?1
         AND is_active = 1
         AND (starts_at IS NULL OR starts_at <= ?2)
         AND (ends_at IS NULL OR ends_at > ?2)`,
      bannerId,
      now,
    );
    return row ? toGachaBanner(row) : null;
  }

  async getPityCounter(userId: string, bannerId: string): Promise<number> {
    const row = await this.first<{ pity_counter: number }>(
      "SELECT pity_counter FROM gacha_pity WHERE user_id = ?1 AND banner_id = ?2",
      userId,
      bannerId,
    );
    return row?.pity_counter ?? 0;
  }

  async findRollByIdempotencyKey(userId: string, idempotencyKey: string): Promise<GachaRollResult | null> {
    const row = await this.first<GachaRollRow>(
      "SELECT * FROM gacha_rolls WHERE user_id = ?1 AND idempotency_key = ?2",
      userId,
      idempotencyKey,
    );
    return row ? toGachaRoll(row) : null;
  }

  async spendGachaCurrency(userId: string, cost: number, now: string): Promise<boolean> {
    const result = await this.run(
      `UPDATE user_profiles
       SET gacha_currency = gacha_currency - ?1, updated_at = ?2
       WHERE user_id = ?3 AND gacha_currency >= ?1`,
      cost,
      now,
      userId,
    );
    return (result.meta.changes ?? 0) === 1;
  }

  async refundGachaCurrency(userId: string, amount: number, now: string): Promise<void> {
    await this.run(
      "UPDATE user_profiles SET gacha_currency = gacha_currency + ?1, updated_at = ?2 WHERE user_id = ?3",
      amount,
      now,
      userId,
    );
  }

  async recordGachaRoll(input: {
    userId: string;
    bannerId: string;
    idempotencyKey: string;
    pullCount: 1 | 10;
    cost: number;
    pityBefore: number;
    pityAfter: number;
    results: Array<Omit<GachaRateEntry, "weight">>;
    now: string;
  }): Promise<GachaRollResult> {
    const rollId = randomId("roll");
    const statements: D1PreparedStatement[] = [
      this.db
        .prepare(
          `INSERT INTO gacha_rolls
             (id, user_id, banner_id, idempotency_key, pull_count, cost, pity_before, pity_after, result_json, created_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
        )
        .bind(
          rollId,
          input.userId,
          input.bannerId,
          input.idempotencyKey,
          input.pullCount,
          input.cost,
          input.pityBefore,
          input.pityAfter,
          JSON.stringify(input.results),
          input.now,
        ),
      this.db
        .prepare(
          `INSERT INTO gacha_pity (user_id, banner_id, pity_counter, updated_at)
           VALUES (?1, ?2, ?3, ?4)
           ON CONFLICT(user_id, banner_id) DO UPDATE SET
             pity_counter = excluded.pity_counter,
             updated_at = excluded.updated_at`,
        )
        .bind(input.userId, input.bannerId, input.pityAfter, input.now),
    ];

    for (const result of input.results) {
      statements.push(
        this.db
          .prepare(
            `INSERT INTO inventory_items
               (id, user_id, item_key, rarity, quantity, first_acquired_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, 1, ?5, ?5)
             ON CONFLICT(user_id, item_key) DO UPDATE SET
               quantity = quantity + 1,
               rarity = excluded.rarity,
               updated_at = excluded.updated_at`,
          )
          .bind(randomId("inv"), input.userId, result.itemKey, result.rarity, input.now),
      );
    }

    await this.db.batch(statements);

    return {
      rollId,
      bannerId: input.bannerId,
      pullCount: input.pullCount,
      cost: input.cost,
      pityBefore: input.pityBefore,
      pityAfter: input.pityAfter,
      results: input.results,
      createdAt: input.now,
    };
  }

  async listRollHistory(userId: string): Promise<GachaRollResult[]> {
    const rows = await this.all<GachaRollRow>(
      "SELECT * FROM gacha_rolls WHERE user_id = ?1 ORDER BY created_at DESC LIMIT 100",
      userId,
    );
    return rows.map(toGachaRoll);
  }

  async listInventory(userId: string): Promise<InventoryItem[]> {
    const rows = await this.all<InventoryItemRow>(
      "SELECT * FROM inventory_items WHERE user_id = ?1 ORDER BY updated_at DESC",
      userId,
    );
    return rows.map(toInventoryItem);
  }

  async listAssetRecords(): Promise<AssetRecord[]> {
    const rows = await this.all<AssetRecordRow>("SELECT * FROM asset_records ORDER BY created_at DESC");
    return rows.map(toAssetRecord);
  }

  async rateLimitHit(input: {
    key: string;
    route: string;
    windowStart: string;
    limit: number;
    now: string;
  }): Promise<{ allowed: boolean; remaining: number }> {
    await this.run(
      `INSERT INTO rate_limits (key, route, window_start, count, updated_at)
       VALUES (?1, ?2, ?3, 1, ?4)
       ON CONFLICT(key, route, window_start) DO UPDATE SET
         count = count + 1,
         updated_at = excluded.updated_at`,
      input.key,
      input.route,
      input.windowStart,
      input.now,
    );
    const row = await this.first<{ count: number }>(
      "SELECT count FROM rate_limits WHERE key = ?1 AND route = ?2 AND window_start = ?3",
      input.key,
      input.route,
      input.windowStart,
    );
    const count = row?.count ?? input.limit + 1;
    return { allowed: count <= input.limit, remaining: Math.max(input.limit - count, 0) };
  }

  async audit(input: {
    actorUserId: string | null;
    action: AuditAction;
    entityType: string;
    entityId: string | null;
    metadata: unknown;
    now: string;
  }): Promise<void> {
    await this.run(
      `INSERT INTO audit_logs
         (id, actor_user_id, action, entity_type, entity_id, metadata_json, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
      randomId("aud"),
      input.actorUserId,
      input.action,
      input.entityType,
      input.entityId,
      JSON.stringify(input.metadata),
      input.now,
    );
  }
}

export function toAuthUser(row: Pick<UserRow, "id" | "email" | "created_at"> & Pick<UserProfileRow, "username" | "display_name">): AuthUser {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name,
    createdAt: row.created_at,
  };
}

export function toSessionContext(row: SessionUserRow) {
  return {
    sessionId: row.session_id,
    user: toAuthUser(row),
    profile: {
      userId: row.id,
      username: row.username,
      displayName: row.display_name,
      avatarAssetKey: row.avatar_asset_key,
      gachaCurrency: row.gacha_currency,
      softCurrency: row.soft_currency,
      createdAt: row.profile_created_at,
      updatedAt: row.profile_updated_at,
    },
  };
}

function toUserProfile(row: UserProfileRow): UserProfile {
  return {
    userId: row.user_id,
    username: row.username,
    displayName: row.display_name,
    avatarAssetKey: row.avatar_asset_key,
    gachaCurrency: row.gacha_currency,
    softCurrency: row.soft_currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toGameSave(row: GameSaveRow) {
  return {
    id: row.id,
    slot: row.slot,
    name: row.name,
    mapId: row.map_id,
    gameVersion: row.game_version,
    day: row.day,
    state: JSON.parse(row.state_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toGeneratedMap(row: GeneratedMapRow): GeneratedMap {
  return {
    id: row.id,
    name: row.name,
    seed: row.seed,
    mapVersion: row.map_version,
    config: JSON.parse(row.config_json),
    createdAt: row.created_at,
  };
}

function toGachaBanner(row: GachaBannerRow): GachaBanner {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    cost: row.cost,
    pityThreshold: row.pity_threshold,
    rates: JSON.parse(row.rates_json) as GachaRateEntry[],
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  };
}

function toGachaRoll(row: GachaRollRow): GachaRollResult {
  return {
    rollId: row.id,
    bannerId: row.banner_id,
    pullCount: row.pull_count,
    cost: row.cost,
    pityBefore: row.pity_before,
    pityAfter: row.pity_after,
    results: JSON.parse(row.result_json) as GachaRollResult["results"],
    createdAt: row.created_at,
  };
}

function toInventoryItem(row: InventoryItemRow): InventoryItem {
  return {
    id: row.id,
    itemKey: row.item_key,
    rarity: row.rarity,
    quantity: row.quantity,
    firstAcquiredAt: row.first_acquired_at,
    updatedAt: row.updated_at,
  };
}

function toAssetRecord(row: AssetRecordRow): AssetRecord {
  return {
    id: row.id,
    key: row.key,
    r2Key: row.r2_key,
    assetType: row.asset_type,
    prompt: row.prompt,
    model: row.model,
    width: row.width,
    height: row.height,
    metadata: JSON.parse(row.metadata_json),
    createdAt: row.created_at,
  };
}
