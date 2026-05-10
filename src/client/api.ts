import type { ApiResponse, ClientConfig, GachaBanner, GachaRollResult, GeneratedMap, MeResponse } from "../shared/apiTypes";
import type { GameState } from "../shared/gameTypes";

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(path, {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
      credentials: "include",
    });
    const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;
    if (body) return body;
    return { ok: false, error: { code: "internal_error", message: "API応答を読めませんでした" } };
  } catch {
    return { ok: false, error: { code: "internal_error", message: "通信できないため端末保存で継続します" } };
  }
}

function mockUser(email: string, username = "ゲスト市長"): MeResponse {
  const now = new Date().toISOString();
  return {
    user: { id: "guest-account", email, username, displayName: username, createdAt: now },
    profile: {
      userId: "guest-account",
      username,
      displayName: username,
      avatarAssetKey: null,
      gachaCurrency: 120,
      softCurrency: 1800,
      createdAt: now,
      updatedAt: now,
    },
  };
}

function fallbackRoll(bannerId: string, pullCount: 1 | 10): GachaRollResult {
  const now = new Date().toISOString();
  return {
    rollId: `local-${Date.now()}`,
    bannerId,
    pullCount,
    cost: pullCount === 10 ? 100 : 10,
    pityBefore: 0,
    pityAfter: pullCount,
    createdAt: now,
    results: [
      {
        itemKey: "local-support-card",
        name: "緊急つなぎ融資",
        rarity: "R",
        assetKey: null,
        metadata: { localFallback: true },
      },
    ],
  };
}

export const api = {
  clientConfig: async (): Promise<ApiResponse<ClientConfig>> => {
    const result = await jsonFetch<ClientConfig>("/api/client-config");
    return result.ok
      ? result
      : ({
          ok: true,
          data: {
            appEnv: "local",
            turnstileSiteKey: null,
            turnstileRequired: false,
            codexImageModel: "gpt-image-2",
            freeGachaDailyLimit: 3,
          },
        } satisfies ApiResponse<ClientConfig>);
  },
  me: () => jsonFetch<MeResponse>("/api/auth/me"),
  signup: async (email: string, username: string, password: string, turnstileToken?: string): Promise<ApiResponse<MeResponse>> => {
    const result = await jsonFetch<MeResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, username, password, turnstileToken }),
    });
    return result.ok || result.error.code !== "internal_error"
      ? result
      : ({ ok: true, data: mockUser(email, username) } satisfies ApiResponse<MeResponse>);
  },
  login: async (email: string, password: string, turnstileToken?: string): Promise<ApiResponse<MeResponse>> => {
    const result = await jsonFetch<MeResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, turnstileToken }),
    });
    return result.ok || result.error.code !== "internal_error"
      ? result
      : ({ ok: true, data: mockUser(email) } satisfies ApiResponse<MeResponse>);
  },
  logout: async (): Promise<ApiResponse<{ ok: true }>> => {
    const result = await jsonFetch<{ ok: true }>("/api/auth/logout", { method: "POST", body: "{}" });
    return result.ok ? result : ({ ok: true, data: { ok: true } } satisfies ApiResponse<{ ok: true }>);
  },
  generateMap: async (seed: string, width: number, height: number, difficulty: string, biomeBias: string): Promise<ApiResponse<GeneratedMap>> => {
    const result = await jsonFetch<GeneratedMap>("/api/maps/generate", {
      method: "POST",
      body: JSON.stringify({ seed, width, height, difficulty, biomeBias }),
    });
    return result.ok
      ? result
      : ({
          ok: true,
          data: {
            id: `local-map-${seed}`,
            name: "端末生成マップ",
            seed,
            mapVersion: "local-pr1",
            config: { width, height, difficulty, biomeBias },
            createdAt: new Date().toISOString(),
          },
        } satisfies ApiResponse<GeneratedMap>);
  },
  saveGame: async (state: GameState, mapId = "guest-map"): Promise<ApiResponse<{ id: string }>> => {
    const result = await jsonFetch<{ id: string }>("/api/saves", {
      method: "POST",
      body: JSON.stringify({ slot: 1, name: `Day ${state.day}`, mapId, gameVersion: "0.1.0-pr1", day: state.day, state }),
    });
    return result.ok ? result : ({ ok: true, data: { id: "local-save" } } satisfies ApiResponse<{ id: string }>);
  },
  banners: async (): Promise<ApiResponse<GachaBanner[]>> => {
    const result = await jsonFetch<GachaBanner[]>("/api/gacha/banners");
    return result.ok
      ? result
      : ({
          ok: true,
          data: [{ id: "start-dash", slug: "start-dash", title: "スタートダッシュ", cost: 10, pityThreshold: 100, rates: [], startsAt: null, endsAt: null }],
        } satisfies ApiResponse<GachaBanner[]>);
  },
  roll: async (bannerId: string, pullCount: 1 | 10, turnstileToken?: string): Promise<ApiResponse<GachaRollResult>> => {
    const result = await jsonFetch<GachaRollResult>("/api/gacha/roll", {
      method: "POST",
      body: JSON.stringify({ bannerId, pullCount, idempotencyKey: crypto.randomUUID(), turnstileToken }),
    });
    return result.ok || !["internal_error", "unauthorized"].includes(result.error.code)
      ? result
      : ({ ok: true, data: fallbackRoll(bannerId, pullCount) } satisfies ApiResponse<GachaRollResult>);
  },
};
