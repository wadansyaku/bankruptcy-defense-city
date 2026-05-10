# 破産防衛都市

破産防衛都市は、崩れかけた都市財政を守るスマホ前提の防衛シミュレーションです。プレイヤーは限られた無料通貨を使い、債務、災害、企業撤退、住民不満を抑えながら区画を守ります。PR1 ではゲストプレイ、ログイン同期、D1 保存、無料通貨ガチャ、都市マップ生成、スマホ UI、AI アセット生成パイプラインまで実装済みの状態を基準にします。

## 技術スタック

- Frontend: React / TypeScript / Vite SPA
- Runtime: Cloudflare Workers Static Assets
- API: Worker script under `src/worker/index.ts`
- Database: Cloudflare D1
- Object storage: Cloudflare R2
- Session/cache: Cloudflare KV
- Bot/abuse protection: Cloudflare Turnstile
- AI assets: Codex GPT image2 local import, placeholder fallback built in

## ローカル開発

```bash
npm install

# Vite local dev
npm run dev

# Codex GPT image2素材を取り込み、未生成分はプレースホルダー化
npm run assets:generate

# Worker + Static Assets local dev
npm run cf:dev
```

`.dev.vars` はコミットしません。初回は `.dev.vars.example` をコピーして、必要な値だけ埋めます。画像生成にOpenAI APIキーは使わず、Codex GPT image2で生成したPNGをローカル取り込みします。画像が未生成でも placeholder asset 生成は動く設計です。

## Cloudflare Dev / Deploy

`wrangler.jsonc` は Workers Static Assets を前提にしています。

- `assets.directory`: `./dist/client`
- `assets.not_found_handling`: `single-page-application`
- `assets.run_worker_first`: `/api/*`
- Worker entrypoint: `src/worker/index.ts`

```bash
npm run cf:dev
npm exec -- wrangler deploy --dry-run
npm run cf:deploy
```

`/api/*` は常に Worker を先に通し、それ以外の SPA route は build 済み `index.html` に fallback します。

## D1 Migration

```bash
# migration 作成
npx wrangler d1 migrations create bankruptcy-defense-city init

# local D1 へ適用
npx wrangler d1 migrations apply bankruptcy-defense-city --local

# remote D1 へ適用
npx wrangler d1 migrations apply bankruptcy-defense-city --remote

# preview D1 へ適用
npm run db:migrate:preview

# 状態確認
npx wrangler d1 migrations list bankruptcy-defense-city
```

本番前は remote migration の直前にバックアップや export 方針を確認してください。PR1 はログイン、ゲーム状態、無料通貨 ledger、ガチャ履歴、都市マップ seed を D1 に保存する構成です。

## R2 / KV / Turnstile

- R2: AI 生成画像、カード背景、UI mock、将来のイベントバナーを保存
- KV: 将来の短命設定・イベント設定・Turnstile 検証結果 cache
- Turnstile: ログイン、無料通貨ガチャ、連続 API 実行の abuse gate

R2 upload の試験:

```bash
npm run assets:upload:r2 -- --bucket bankruptcy-defense-city-assets --prefix generated --remote --dry-run
```

## Codex GPT image2 画像生成

`scripts/generate-assets.ts` は外部画像APIを呼びません。Codex GPT image2で生成したPNGを `generated/codex-image2-source/` から取り込みます。

```bash
CODEX_IMAGE_MODEL=gpt-image-2 npm run assets:generate
```

PNGのファイル名は `docs/art-prompts.md` のslugに合わせます。例: `generated/codex-image2-source/hero-city-crisis.png`。未配置のassetは SVG と PNG placeholder を `generated/` と `public/assets/generated/` に生成し、成功終了します。

## GitHub / Cloudflare 連携

GitHub Actions と Cloudflare deploy の詳細は [docs/github-cloudflare-integration.md](docs/github-cloudflare-integration.md) にまとめています。

GitHub repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Cloudflare Worker secrets:

- `SESSION_SECRET`
- `RATE_LIMIT_SALT`
- `TURNSTILE_SECRET_KEY`

## ゲスト / ログイン

PR1 の実装済み方針:

- ゲスト: 即プレイ、端末内進行、低リスクな無料通貨ガチャ
- ログイン: HttpOnly Cookie セッションで D1 に進行、生成マップ、無料通貨ガチャ履歴を保存
- 移行: ゲスト進行中のゲーム状態は同一画面のまま保持され、ログイン後のセーブ操作で D1 保存へ切り替わる

ゲスト状態でも localStorage fallback で進行でき、ログイン後は同じセーブ導線で D1 履歴へ保存できます。

## 無料通貨ガチャ

無料通貨ガチャは、課金導線ではなく継続プレイ報酬として扱います。

- 毎日・ステージ報酬・復興ミッションで無料通貨を配布
- Turnstile と D1 rate limit で連打を抑止
- D1 にガチャ結果、idempotency key、天井カウンター、インベントリ反映を保存
- 確率表記と排出履歴を UI から確認できる

## スマホ操作

縦持ち片手操作を基準にします。

- 主要操作は画面下部の command dock
- マップは drag / tap / long press
- ガチャ、編成、区画強化は 2 tap 以内
- 小さい hover 前提 UI は使わない
- 通勤中の短時間プレイでも 1 wave が終わる尺にする

## テスト

PR1 の標準 gate:

```bash
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm exec -- wrangler deploy --dry-run
```

PR1 では上記に加えて D1 local migration、キーなし placeholder 生成、R2 upload dry-run、Cloudflare local `/api/health` smoke を確認します。

## PR1 完了範囲

- Cloudflare Workers Static Assets / Worker API 配線
- D1 schema / Cookie session / free-currency gacha history
- 無料通貨ガチャ、排出履歴、Turnstile gate
- 都市マップ生成、区画 pressure、core battle loop
- React mobile UI、command dock、card inventory
- Codex GPT image2 / placeholder asset generation pipeline
- R2 asset upload helper と manifest 配信

## 残課題

- 本番 D1 / R2 / KV / Turnstile ID の差し替え
- ガチャ・pressure・報酬量のバランス調整
- 追加アートの品質 gate と差し替え
- production smoke URL の確定
