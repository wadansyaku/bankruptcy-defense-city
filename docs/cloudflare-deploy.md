# Cloudflare Deploy Runbook

## Goal

破産防衛都市は Cloudflare Workers Static Assets で配信します。SPA の静的配信と `/api/*` Worker API を 1 つの Worker にまとめ、D1 / R2 / KV / Turnstile を同じ runtime contract で扱います。

## Current Config

`wrangler.jsonc`:

- `name`: `bankruptcy-defense-city`
- `main`: `src/worker/index.ts`
- `assets.directory`: `./dist/client`
- `assets.not_found_handling`: `single-page-application`
- `assets.run_worker_first`: `["/api/*"]`
- `DB`: D1 binding
- `ASSETS_BUCKET`: R2 binding
- `CONFIG_KV`: KV binding

## Local Dev

```bash
cp .dev.vars.example .dev.vars
npx wrangler dev
```

Local dev uses local storage simulation by default. Use remote bindings only when intentionally testing real resources.

## D1 Setup

```bash
npx wrangler d1 create bankruptcy-defense-city
npx wrangler d1 migrations create bankruptcy-defense-city init
npx wrangler d1 migrations apply bankruptcy-defense-city --local
npx wrangler d1 migrations apply bankruptcy-defense-city --remote
npx wrangler d1 migrations apply DB --env preview --remote
```

After `d1 create`, replace `database_id` in `wrangler.jsonc`.

## R2 Setup

```bash
npx wrangler r2 bucket create bankruptcy-defense-city-assets
npx wrangler r2 bucket create bankruptcy-defense-city-assets-preview
```

Dry-run upload:

```bash
npm run assets:upload:r2 -- --bucket bankruptcy-defense-city-assets --prefix generated --remote --dry-run
```

Actual upload:

```bash
npm run assets:upload:r2 -- --bucket bankruptcy-defense-city-assets --prefix generated --remote
```

## KV Setup

```bash
npx wrangler kv namespace create CONFIG_KV
npx wrangler kv namespace create CONFIG_KV --preview
```

Replace `id` and `preview_id` in `wrangler.jsonc`.

## Turnstile

Create a Turnstile widget in Cloudflare dashboard, then set:

- `TURNSTILE_SITE_KEY` in `wrangler.jsonc` vars or public config.
- `TURNSTILE_SECRET_KEY` as a Worker secret.

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY --env preview --config wrangler.jsonc
npx wrangler secret put TURNSTILE_SECRET_KEY --env production --config wrangler.jsonc
npx wrangler secret put SESSION_SECRET --env preview --config wrangler.jsonc
npx wrangler secret put SESSION_SECRET --env production --config wrangler.jsonc
npx wrangler secret put RATE_LIMIT_SALT --env preview --config wrangler.jsonc
npx wrangler secret put RATE_LIMIT_SALT --env production --config wrangler.jsonc
```

Use Cloudflare test keys only for local smoke. Preview and production use the real Turnstile site key and environment-specific Worker secrets.

## Codex GPT Image2 Assets

OpenAI API secrets are not used. Generate images in Codex with GPT image2 and place PNGs under `generated/codex-image2-source/`, then run the local asset pipeline.

```bash
npm run assets:generate
npm run assets:upload:r2 -- --bucket bankruptcy-defense-city-assets --prefix generated --remote --dry-run
```

Missing PNGs become placeholders, so CI and deploy do not depend on image generation.

## Deploy

```bash
npm run build
npx wrangler deploy --dry-run
npx wrangler deploy
```

After deploy:

```bash
curl -I https://bankruptcy-defense-city-preview.kidsquestmissionjp.workers.dev/
curl https://bankruptcy-defense-city-preview.kidsquestmissionjp.workers.dev/api/health
curl -I https://bankruptcy-defense-city.kidsquestmissionjp.workers.dev/
curl https://bankruptcy-defense-city.kidsquestmissionjp.workers.dev/api/health
```

## Preflight Checklist

- `dist/client/` exists and contains `index.html`.
- Worker entry exists at `src/worker/index.ts`.
- D1 / R2 / KV IDs are not placeholders.
- Secrets are set with `wrangler secret put`.
- Local placeholder assets exist under `public/assets/generated/`.
- `/api/*` routes return Worker responses.
- Non-API deep links return SPA `index.html`.

## Known Coordination Points

- If backend owner chooses another Worker entrypoint, update `wrangler.jsonc` and this runbook together.
- If React build output is not `dist/`, update `assets.directory`.
- If asset public path changes, update `ASSET_PUBLIC_BASE`, docs, and asset manifest.
