# GitHub / Cloudflare Integration

## GitHub

このrepoは GitHub Actions で CI と Cloudflare deploy を実行できる構成です。

Required repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Recommended production Worker secrets:

- `SESSION_SECRET`
- `RATE_LIMIT_SALT`
- `TURNSTILE_SECRET_KEY`

Workflows:

- `.github/workflows/ci.yml`: lint、typecheck、unit/API test、build、E2E、Wrangler dry-run。
- `.github/workflows/cloudflare-deploy.yml`: `main` push で production deploy、manual dispatch で preview / production deploy。
- `.github/dependabot.yml`: npm dependency updates。

GitHub repo:

```bash
git remote -v
```

- `https://github.com/wadansyaku/bankruptcy-defense-city`
- `main` tracks `origin/main`
- GitHub Actions secrets `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` are configured.
- Production deploy workflow has completed successfully.

## Cloudflare

Created resources:

- D1 production: `bankruptcy-defense-city` / `55f0af37-d10c-4285-9ad5-a1cdfc597adc`
- D1 preview: `bankruptcy-defense-city-preview` / `7e5ef27d-642e-4e90-99dc-fc21a379179e`
- R2 production: `bankruptcy-defense-city-assets`
- R2 preview: `bankruptcy-defense-city-assets-preview`
- KV production: `bankruptcy-defense-city-config` / `2d7211d84fd44db589684823b7eee360`
- KV preview: `bankruptcy-defense-city-config-preview` / `7262ea9dc1964dafaf45122434ba894f`
- Turnstile widget: `bankruptcy-defense-city`
  - site key is configured in `wrangler.jsonc` for preview and production.
  - secret key is stored only as Cloudflare Worker secret `TURNSTILE_SECRET_KEY` for preview and production.

Apply migrations:

```bash
npm run db:migrate:remote
npm run db:migrate:preview
```

Production migrations only contain schema and production-safe initial content. The dev test user lives under `seeds/dev_test_user.sql` and is applied only by `npm run db:seed` outside production mode.

Deploy:

```bash
npm run cf:deploy:preview
npm run cf:deploy
```

Deploy commands explicitly pass `--config wrangler.jsonc` so Wrangler uses the requested `preview` / `production` environment instead of the Cloudflare Vite plugin's generated redirect config.

Smoke:

```bash
curl https://bankruptcy-defense-city-preview.kidsquestmissionjp.workers.dev/api/health
curl https://bankruptcy-defense-city.kidsquestmissionjp.workers.dev/api/health
```

## Codex GPT Image2 Assets

OpenAI API keys are not used. Generate images in Codex with GPT image2, then place PNG files here:

```text
generated/codex-image2-source/<asset-slug>.png
```

Expected slugs are listed in `docs/art-prompts.md`. Then run:

```bash
npm run assets:generate
npm run assets:upload:r2 -- --bucket bankruptcy-defense-city-assets --prefix generated --remote --dry-run
```

If a PNG is missing, `scripts/generate-assets.ts` writes a placeholder, so builds and tests do not depend on image generation.
