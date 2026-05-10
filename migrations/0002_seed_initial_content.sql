INSERT OR IGNORE INTO generated_maps (id, user_id, name, seed, map_version, config_json, created_at)
VALUES (
  'map_default_bay',
  NULL,
  '破産防衛都市 ベイエリア',
  'pr1-default-bay',
  '0.1.0-pr1',
  '{"width":96,"height":64,"difficulty":"normal","biomeBias":"ruinedIndustrial","preview":{"verifiedPathable":true}}',
  '2026-05-10T00:00:00.000Z'
);

INSERT OR IGNORE INTO asset_records
  (id, key, r2_key, asset_type, prompt, model, width, height, metadata_json, created_at)
VALUES
  ('asset_card_tax_master', 'card.tax-master', 'cards/tax-master.png', 'card_art', '節税の達人 card art', 'seed', 1024, 1024, '{}', '2026-05-10T00:00:00.000Z'),
  ('asset_card_mass_line', 'card.mass-line', 'cards/mass-line.png', 'card_art', '量産ライン最適化 card art', 'seed', 1024, 1024, '{}', '2026-05-10T00:00:00.000Z'),
  ('asset_card_miracle_budget', 'card.miracle-budget', 'cards/miracle-budget.png', 'card_art', '奇跡の補正予算 card art', 'seed', 1024, 1024, '{}', '2026-05-10T00:00:00.000Z');

INSERT OR IGNORE INTO gacha_banners
  (id, slug, title, cost, pity_threshold, rates_json, starts_at, ends_at, is_active, created_at, updated_at)
VALUES (
  'start-dash',
  'bankruptcy-defense-start-dash',
  '破産防衛スタートダッシュ',
  100,
  100,
  '[
    {"itemKey":"tax-master","name":"節税の達人","rarity":"R","weight":220,"assetKey":"card.tax-master","metadata":{"category":"risk"}},
    {"itemKey":"ammo-coupon","name":"弾薬まとめ買い券","rarity":"N","weight":700,"assetKey":null,"metadata":{"category":"defense"}},
    {"itemKey":"mass-line","name":"量産ライン最適化","rarity":"SR","weight":70,"assetKey":"card.mass-line","metadata":{"category":"logistics"}},
    {"itemKey":"miracle-budget","name":"奇跡の補正予算","rarity":"UR","weight":10,"assetKey":"card.miracle-budget","metadata":{"category":"economy"}}
  ]',
  NULL,
  NULL,
  1,
  '2026-05-10T00:00:00.000Z',
  '2026-05-10T00:00:00.000Z'
);
