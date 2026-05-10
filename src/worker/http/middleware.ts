import { createMiddleware } from "hono/factory";
import { sha256Base64Url } from "../crypto";
import { SqlDatabase } from "../db";
import { parseCookie, sessionCookieName } from "./cookies";
import { ApiError, fail } from "./errors";
import { findSession } from "../services/auth";
import type { AppBindings } from "../types";

const RATE_LIMIT_WINDOW_SECONDS = 60;
const DEFAULT_RATE_LIMIT = 120;
const AUTH_RATE_LIMIT = 20;
const GACHA_RATE_LIMIT = 40;

export const withDatabase = createMiddleware<AppBindings>(async (c, next) => {
  if (!c.env.DB) {
    throw new ApiError(500, "internal_error", "D1 binding DB is not configured");
  }
  await next();
});

export const rateLimit = createMiddleware<AppBindings>(async (c, next) => {
  const db = new SqlDatabase(c.env.DB);
  const now = new Date();
  const windowStart = new Date(Math.floor(now.getTime() / (RATE_LIMIT_WINDOW_SECONDS * 1000)) * RATE_LIMIT_WINDOW_SECONDS * 1000);
  const route = routeBucket(c.req.path);
  const ip = c.req.header("CF-Connecting-IP") ?? c.req.header("X-Forwarded-For") ?? "unknown";
  const key = await sha256Base64Url(`${c.env.RATE_LIMIT_SALT ?? ""}:${ip}`);
  const limit = route === "auth" ? AUTH_RATE_LIMIT : route === "gacha" ? GACHA_RATE_LIMIT : DEFAULT_RATE_LIMIT;
  const result = await db.rateLimitHit({
    key,
    route,
    windowStart: windowStart.toISOString(),
    limit,
    now: now.toISOString(),
  });

  c.header("X-RateLimit-Limit", String(limit));
  c.header("X-RateLimit-Remaining", String(result.remaining));

  if (!result.allowed) {
    return fail(c, 429, "rate_limited", "Too many requests");
  }

  await next();
});

export const requireAuth = createMiddleware<AppBindings>(async (c, next) => {
  const cookieName = sessionCookieName(c.env);
  const token = parseCookie(c.req.header("Cookie") ?? null, cookieName);
  if (!token) {
    throw new ApiError(401, "unauthorized", "Authentication is required");
  }

  const session = await findSession(new SqlDatabase(c.env.DB), c.env, token);
  if (!session) {
    throw new ApiError(401, "unauthorized", "Session is invalid or expired");
  }

  c.set("session", session);
  await next();
});

export function requireTurnstileToken(token: string | undefined) {
  return createMiddleware<AppBindings>(async (c, next) => {
    await verifyTurnstile(c.env, token, c.req.header("CF-Connecting-IP") ?? undefined);
    await next();
  });
}

export async function verifyTurnstile(
  env: AppBindings["Bindings"],
  token: string | undefined,
  remoteIp?: string,
): Promise<void> {
  const isProduction = env.APP_ENV === "production";
  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret && !isProduction) {
    return;
  }
  if (!secret) {
    throw new ApiError(500, "internal_error", "Turnstile secret is not configured");
  }
  if (!token) {
    throw new ApiError(403, "turnstile_required", "Turnstile token is required");
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, response: token, remoteip: remoteIp }),
  });
  const result = (await response.json()) as { success?: boolean; "error-codes"?: string[] };
  if (!result.success) {
    throw new ApiError(403, "turnstile_required", "Turnstile validation failed", result["error-codes"] ?? []);
  }
}

function routeBucket(path: string): string {
  if (path.startsWith("/api/auth")) {
    return "auth";
  }
  if (path.startsWith("/api/gacha")) {
    return "gacha";
  }
  return "api";
}
