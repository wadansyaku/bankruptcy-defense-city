import type { LoginInput, SignupInput } from "../../shared/validation";
import {
  createSessionToken,
  daysFromNow,
  hashPassword,
  hashSecretWithPepper,
  nowIso,
  randomId,
  verifyPassword,
} from "../crypto";
import { SqlDatabase, toAuthUser, toSessionContext } from "../db";
import { ApiError } from "../http/errors";
import type { Env, SessionContext } from "../types";

const SESSION_DAYS = 30;
const INITIAL_GACHA_CURRENCY = 3_000;

export type RequestMeta = {
  userAgent: string | null;
  ipHash: string | null;
};

export async function signup(
  db: SqlDatabase,
  env: Pick<Env, "SESSION_SECRET">,
  input: SignupInput,
  requestMeta: RequestMeta,
): Promise<{ token: string; expiresAt: Date; session: SessionContext }> {
  const existing = await db.findUserByEmail(input.email);
  if (existing) {
    throw new ApiError(409, "conflict", "Email is already registered");
  }

  const now = nowIso();
  const userId = randomId("usr");
  const passwordHash = await hashPassword(input.password);
  await db.createUser({
    id: userId,
    email: input.email,
    passwordHash,
    username: input.username,
    displayName: input.displayName,
    now,
    initialGachaCurrency: INITIAL_GACHA_CURRENCY,
  });
  await db.audit({
    actorUserId: userId,
    action: "auth.signup",
    entityType: "user",
    entityId: userId,
    metadata: { email: input.email, username: input.username },
    now,
  });

  return createSessionForUser(db, env, userId, requestMeta, now);
}

export async function login(
  db: SqlDatabase,
  env: Pick<Env, "SESSION_SECRET">,
  input: LoginInput,
  requestMeta: RequestMeta,
): Promise<{ token: string; expiresAt: Date; session: SessionContext }> {
  const user = await db.findUserByEmail(input.email);
  if (!user || user.disabled_at) {
    throw new ApiError(401, "unauthorized", "Invalid email or password");
  }

  const validPassword = await verifyPassword(input.password, user.password_hash);
  if (!validPassword) {
    throw new ApiError(401, "unauthorized", "Invalid email or password");
  }

  const now = nowIso();
  await db.audit({
    actorUserId: user.id,
    action: "auth.login",
    entityType: "session",
    entityId: null,
    metadata: { email: input.email },
    now,
  });

  return createSessionForUser(db, env, user.id, requestMeta, now);
}

export async function logout(db: SqlDatabase, session: SessionContext): Promise<void> {
  const now = nowIso();
  await db.revokeSession(session.sessionId, now);
  await db.audit({
    actorUserId: session.user.id,
    action: "auth.logout",
    entityType: "session",
    entityId: session.sessionId,
    metadata: {},
    now,
  });
}

export async function findSession(
  db: SqlDatabase,
  env: Pick<Env, "SESSION_SECRET">,
  token: string,
): Promise<SessionContext | null> {
  const tokenHash = await hashSecretWithPepper(token, env.SESSION_SECRET ?? "");
  const row = await db.findSessionByTokenHash(tokenHash, nowIso());
  if (!row) {
    return null;
  }

  await db.touchSession(row.session_id, nowIso());
  return toSessionContext(row);
}

async function createSessionForUser(
  db: SqlDatabase,
  env: Pick<Env, "SESSION_SECRET">,
  userId: string,
  requestMeta: RequestMeta,
  now: string,
): Promise<{ token: string; expiresAt: Date; session: SessionContext }> {
  const token = createSessionToken();
  const tokenHash = await hashSecretWithPepper(token, env.SESSION_SECRET ?? "");
  const expiresAt = daysFromNow(SESSION_DAYS);
  const sessionId = randomId("ses");
  await db.createSession({
    id: sessionId,
    userId,
    tokenHash,
    expiresAt: expiresAt.toISOString(),
    now,
    userAgent: requestMeta.userAgent,
    ipHash: requestMeta.ipHash,
  });

  const row = await db.findSessionByTokenHash(tokenHash, now);
  if (!row) {
    throw new ApiError(500, "internal_error", "Session creation failed");
  }

  return { token, expiresAt, session: { ...toSessionContext(row), user: toAuthUser(row) } };
}
