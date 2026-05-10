PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  disabled_at TEXT
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_asset_key TEXT,
  soft_currency INTEGER NOT NULL DEFAULT 0 CHECK (soft_currency >= 0),
  gacha_currency INTEGER NOT NULL DEFAULT 0 CHECK (gacha_currency >= 0),
  last_login_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_username_unique
  ON user_profiles (lower(username));

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  user_agent TEXT,
  ip_hash TEXT,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);

CREATE TABLE IF NOT EXISTS generated_maps (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  seed TEXT NOT NULL,
  map_version TEXT NOT NULL,
  config_json TEXT NOT NULL CHECK (json_valid(config_json)),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS game_saves (
  id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot INTEGER NOT NULL DEFAULT 1 CHECK (slot >= 1 AND slot <= 5),
  name TEXT NOT NULL,
  map_id TEXT NOT NULL REFERENCES generated_maps(id),
  game_version TEXT NOT NULL,
  day INTEGER NOT NULL CHECK (day >= 0),
  state_json TEXT NOT NULL CHECK (json_valid(state_json)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_game_saves_user_updated
  ON game_saves(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS gacha_banners (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  cost INTEGER NOT NULL CHECK (cost > 0),
  pity_threshold INTEGER NOT NULL DEFAULT 90 CHECK (pity_threshold >= 0),
  rates_json TEXT NOT NULL CHECK (json_valid(rates_json)),
  starts_at TEXT,
  ends_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS gacha_rolls (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  banner_id TEXT NOT NULL REFERENCES gacha_banners(id),
  idempotency_key TEXT NOT NULL,
  pull_count INTEGER NOT NULL CHECK (pull_count IN (1, 10)),
  cost INTEGER NOT NULL CHECK (cost >= 0),
  pity_before INTEGER NOT NULL CHECK (pity_before >= 0),
  pity_after INTEGER NOT NULL CHECK (pity_after >= 0),
  result_json TEXT NOT NULL CHECK (json_valid(result_json)),
  created_at TEXT NOT NULL,
  UNIQUE (user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_gacha_rolls_user_created
  ON gacha_rolls(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS gacha_pity (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  banner_id TEXT NOT NULL REFERENCES gacha_banners(id) ON DELETE CASCADE,
  pity_counter INTEGER NOT NULL DEFAULT 0 CHECK (pity_counter >= 0),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, banner_id)
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('N', 'R', 'SR', 'UR')),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  first_acquired_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (user_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_user_updated
  ON inventory_items(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS asset_records (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  r2_key TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('card_art', 'avatar', 'map', 'ui')),
  prompt TEXT,
  model TEXT,
  width INTEGER,
  height INTEGER,
  metadata_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata_json)),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata_json)),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created
  ON audit_logs(actor_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT NOT NULL,
  route TEXT NOT NULL,
  window_start TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (key, route, window_start)
);
