import type { ApiResult, AppSnapshot, AuthPayload, Card, UserProfile } from "../types";

const JSON_HEADERS = { "Content-Type": "application/json" };

async function requestJson<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      ...init,
      headers: {
        ...JSON_HEADERS,
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }

    const data = (await response.json()) as T;
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      offline: true,
      error: error instanceof Error ? error.message : "network unavailable",
    };
  }
}

function offlineUser(payload: AuthPayload, mode: "login" | "signup"): UserProfile {
  const displayName = payload.name?.trim() || payload.email.split("@")[0] || "防衛隊長";
  return {
    id: `offline-${mode}-${Date.now()}`,
    name: displayName,
    email: payload.email,
    mode: "account",
    offline: true,
  };
}

export const apiClient = {
  async login(payload: AuthPayload): Promise<ApiResult<UserProfile>> {
    const result = await requestJson<UserProfile>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (result.ok && result.data) {
      return result;
    }

    return { ok: true, data: offlineUser(payload, "login"), offline: true, error: result.error };
  },

  async signup(payload: AuthPayload): Promise<ApiResult<UserProfile>> {
    const result = await requestJson<UserProfile>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (result.ok && result.data) {
      return result;
    }

    return { ok: true, data: offlineUser(payload, "signup"), offline: true, error: result.error };
  },

  async sync(snapshot: AppSnapshot): Promise<ApiResult<{ syncedAt: string }>> {
    return requestJson<{ syncedAt: string }>("/api/sync", {
      method: "POST",
      body: JSON.stringify(snapshot),
    });
  },

  async saveGame(snapshot: AppSnapshot): Promise<ApiResult<{ savedAt: string }>> {
    return requestJson<{ savedAt: string }>("/api/games/current", {
      method: "PUT",
      body: JSON.stringify(snapshot),
    });
  },

  async pullGacha(): Promise<ApiResult<Card[]>> {
    return requestJson<Card[]>("/api/gacha/pull", { method: "POST" });
  },
};
