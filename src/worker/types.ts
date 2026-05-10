import type { AuthUser, UserProfile } from "../shared/apiTypes";

export type AppEnvName = "development" | "local" | "preview" | "test" | "production";

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  ASSETS_BUCKET?: R2Bucket;
  CONFIG_KV?: KVNamespace;
  APP_ENV?: AppEnvName;
  SESSION_COOKIE_NAME?: string;
  SESSION_SECRET?: string;
  RATE_LIMIT_SALT?: string;
  TURNSTILE_SECRET_KEY?: string;
}

export type SessionContext = {
  sessionId: string;
  user: AuthUser;
  profile: UserProfile;
};

export type AppBindings = {
  Bindings: Env;
  Variables: {
    session: SessionContext;
  };
};

export type SqlValue = string | number | boolean | null;

export type AuditAction =
  | "auth.signup"
  | "auth.login"
  | "auth.logout"
  | "profile.update"
  | "save.upsert"
  | "save.delete"
  | "gacha.pull";
