import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";
import {
  gachaRollSchema,
  loginSchema,
  routeIdSchema,
  signupSchema,
  updateProfileSchema,
  upsertGameSaveSchema,
} from "../shared/validation";
import { CARD_DEFINITIONS } from "../client/game/core/cards";
import { generateMap } from "../client/game/core/mapgen";
import { hashSecretWithPepper } from "./crypto";
import { randomId, nowIso } from "./crypto";
import { SqlDatabase } from "./db";
import { buildSessionCookie, clearSessionCookie, sessionCookieName } from "./http/cookies";
import { fail, ok, toErrorResponse } from "./http/errors";
import { rateLimit, requireAuth, verifyTurnstile, withDatabase } from "./http/middleware";
import { parseJson, parseParams } from "./http/request";
import { login, logout, signup } from "./services/auth";
import { rollGacha } from "./services/gacha";
import { deleteGameSave, updateProfile, upsertGameSave } from "./services/profile";
import type { AppBindings } from "./types";

export function createApp(): Hono<AppBindings> {
  const app = new Hono<AppBindings>();

  app.onError((error, c) => toErrorResponse(c, error));

  app.use(
    "/api/*",
    cors({
      origin: (origin) => origin,
      credentials: true,
      allowHeaders: ["Content-Type", "X-Turnstile-Token"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    }),
  );
  app.use("/api/*", withDatabase);
  app.use("/api/*", rateLimit);

  app.get("/api/health", (c) => ok(c, { service: "bankruptcy-defense-city-api", status: "ok" }));

  app.get("/api/client-config", (c) =>
    ok(c, {
      appEnv: c.env.APP_ENV ?? "local",
      turnstileSiteKey: c.env.TURNSTILE_SITE_KEY ?? null,
      turnstileRequired: Boolean(c.env.TURNSTILE_SECRET_KEY || c.env.APP_ENV === "production" || c.env.APP_ENV === "preview"),
      codexImageModel: c.env.CODEX_IMAGE_MODEL ?? "gpt-image-2",
      freeGachaDailyLimit: Number(c.env.FREE_GACHA_DAILY_LIMIT ?? 3),
    }),
  );

  app.post("/api/auth/signup", async (c) => {
    const input = await parseJson(c, signupSchema);
    await verifyTurnstile(c.env, input.turnstileToken, c.req.header("CF-Connecting-IP") ?? undefined);
    const db = new SqlDatabase(c.env.DB);
    const result = await signup(db, c.env, input, await requestMeta(c));
    c.header("Set-Cookie", buildSessionCookie(sessionCookieName(c.env), result.token, result.expiresAt, c.env.APP_ENV === "production"));
    return ok(c, { user: result.session.user, profile: result.session.profile }, 201);
  });

  app.post("/api/auth/login", async (c) => {
    const input = await parseJson(c, loginSchema);
    await verifyTurnstile(c.env, input.turnstileToken, c.req.header("CF-Connecting-IP") ?? undefined);
    const db = new SqlDatabase(c.env.DB);
    const result = await login(db, c.env, input, await requestMeta(c));
    c.header("Set-Cookie", buildSessionCookie(sessionCookieName(c.env), result.token, result.expiresAt, c.env.APP_ENV === "production"));
    return ok(c, { user: result.session.user, profile: result.session.profile });
  });

  app.post("/api/auth/logout", requireAuth, async (c) => {
    const session = c.get("session");
    await logout(new SqlDatabase(c.env.DB), session);
    c.header("Set-Cookie", clearSessionCookie(sessionCookieName(c.env), c.env.APP_ENV === "production"));
    return ok(c, { loggedOut: true });
  });

  app.get("/api/auth/me", requireAuth, (c) => {
    const session = c.get("session");
    return ok(c, { user: session.user, profile: session.profile });
  });

  app.get("/api/profile", requireAuth, (c) => ok(c, c.get("session").profile));

  app.put("/api/profile", requireAuth, async (c) => {
    const input = await parseJson(c, updateProfileSchema);
    const profile = await updateProfile(new SqlDatabase(c.env.DB), c.get("session").user.id, input);
    return ok(c, profile);
  });

  app.get("/api/saves", requireAuth, async (c) => {
    const saves = await new SqlDatabase(c.env.DB).listGameSaves(c.get("session").user.id);
    return ok(c, saves);
  });

  app.get("/api/saves/:id", requireAuth, async (c) => {
    const { id } = parseParams(c.req.param(), routeIdSchema);
    const save = await new SqlDatabase(c.env.DB).getGameSave(c.get("session").user.id, id);
    return save ? ok(c, save) : fail(c, 404, "not_found", "Save was not found");
  });

  app.post("/api/saves", requireAuth, async (c) => {
    const input = await parseJson(c, upsertGameSaveSchema);
    const save = await upsertGameSave(new SqlDatabase(c.env.DB), c.get("session").user.id, input);
    return ok(c, save, 201);
  });

  app.put("/api/saves", requireAuth, async (c) => {
    const input = await parseJson(c, upsertGameSaveSchema);
    const save = await upsertGameSave(new SqlDatabase(c.env.DB), c.get("session").user.id, input);
    return ok(c, save);
  });

  app.delete("/api/saves/:id", requireAuth, async (c) => {
    const { id } = parseParams(c.req.param(), routeIdSchema);
    await deleteGameSave(new SqlDatabase(c.env.DB), c.get("session").user.id, id);
    return ok(c, { deleted: true });
  });

  app.get("/api/maps", requireAuth, async (c) => {
    const maps = await new SqlDatabase(c.env.DB).listGeneratedMaps();
    return ok(c, maps);
  });

  app.get("/api/maps/:id", requireAuth, async (c) => {
    const { id } = parseParams(c.req.param(), routeIdSchema);
    const map = await new SqlDatabase(c.env.DB).getGeneratedMap(id);
    return map ? ok(c, map) : fail(c, 404, "not_found", "Map was not found");
  });

  app.post("/api/maps/generate", requireAuth, async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as {
      seed?: string;
      width?: number;
      height?: number;
      difficulty?: "easy" | "normal" | "hard" | "bankruptcy";
      biomeBias?: "ruinedIndustrial" | "swamp" | "housingRuins" | "wasteland" | "mountainResource";
    };
    const seed = body.seed?.trim() || `server-${Date.now()}`;
    const map = generateMap(seed, {
      width: body.width,
      height: body.height,
      difficulty: body.difficulty,
      biomeBias: body.biomeBias,
    });
    const saved = await new SqlDatabase(c.env.DB).createGeneratedMap({
      id: randomId("map"),
      userId: c.get("session").user.id,
      name: `生成マップ ${seed}`,
      seed,
      mapVersion: "0.1.0-pr1",
      config: {
        width: map.width,
        height: map.height,
        difficulty: map.difficulty,
        biomeBias: map.biomeBias,
        preview: {
          hqCandidates: map.hqCandidates,
          spawns: map.spawns,
          verifiedPathable: map.verifiedPathable,
          sampleTiles: map.tiles.filter((_, index) => index % 97 === 0).slice(0, 64),
        },
      },
      now: nowIso(),
    });
    return ok(c, saved, 201);
  });

  app.get("/api/gacha/banners", requireAuth, async (c) => {
    const banners = await new SqlDatabase(c.env.DB).listActiveBanners(new Date().toISOString());
    return ok(c, banners);
  });

  app.get("/api/gacha/banners/:id/rates", requireAuth, async (c) => {
    const { id } = parseParams(c.req.param(), routeIdSchema);
    const banner = await new SqlDatabase(c.env.DB).getBanner(id, new Date().toISOString());
    return banner ? ok(c, banner.rates) : fail(c, 404, "not_found", "Gacha banner was not found");
  });

  app.post("/api/gacha/roll", requireAuth, async (c) => {
    const input = await parseJson(c, gachaRollSchema);
    await verifyTurnstile(c.env, input.turnstileToken, c.req.header("CF-Connecting-IP") ?? undefined);
    const roll = await rollGacha(new SqlDatabase(c.env.DB), c.get("session").user.id, input);
    return ok(c, roll, 201);
  });

  app.get("/api/gacha/history", requireAuth, async (c) => {
    const rolls = await new SqlDatabase(c.env.DB).listRollHistory(c.get("session").user.id);
    return ok(c, rolls);
  });

  app.get("/api/inventory", requireAuth, async (c) => {
    const items = await new SqlDatabase(c.env.DB).listInventory(c.get("session").user.id);
    return ok(c, items);
  });

  app.get("/api/cards/definitions", (c) => ok(c, CARD_DEFINITIONS));

  app.get("/api/assets/:key", async (c) => {
    const key = c.req.param("key").replaceAll("..", "").replace(/[^a-zA-Z0-9._/-]/g, "");
    if (c.env.ASSETS_BUCKET) {
      const object = await c.env.ASSETS_BUCKET.get(key);
      if (object) {
        return new Response(object.body, {
          headers: {
            "content-type": object.httpMetadata?.contentType ?? "application/octet-stream",
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      }
    }
    return c.env.ASSETS.fetch(new Request(new URL(`/assets/generated/${key}`, c.req.url)));
  });

  app.get("/api/assets", requireAuth, async (c) => {
    const assets = await new SqlDatabase(c.env.DB).listAssetRecords();
    return ok(c, { assets });
  });

  return app;
}

async function requestMeta(c: Context<AppBindings>) {
  const ip = c.req.header("CF-Connecting-IP") ?? c.req.header("X-Forwarded-For") ?? null;
  return {
    userAgent: c.req.header("User-Agent") ?? null,
    ipHash: ip ? await hashSecretWithPepper(ip, c.env.RATE_LIMIT_SALT ?? "") : null,
  };
}
