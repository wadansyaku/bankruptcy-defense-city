INSERT OR IGNORE INTO users (id, email, password_hash, created_at, updated_at)
VALUES (
  'usr_dev_test',
  'dev@example.test',
  'pbkdf2-sha256$210000$ZGV2dGVzdHNhbHQwMDAwMQ$5Ca3FikrC_HqSygBn7P6XCrUJjrJkzvgGxRXRuGl5Qw',
  '2026-05-10T00:00:00.000Z',
  '2026-05-10T00:00:00.000Z'
);

INSERT OR IGNORE INTO user_profiles
  (user_id, username, display_name, avatar_asset_key, soft_currency, gacha_currency, last_login_at, created_at, updated_at)
VALUES (
  'usr_dev_test',
  'dev_player',
  'Dev Player',
  NULL,
  5000,
  10000,
  '2026-05-10T00:00:00.000Z',
  '2026-05-10T00:00:00.000Z',
  '2026-05-10T00:00:00.000Z'
);
