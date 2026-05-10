import { describe, expect, it } from "vitest";
import { gachaRollSchema, signupSchema, upsertGameSaveSchema } from "../../src/shared/validation";
import { resolveGachaRoll } from "../../src/worker/services/gacha";

describe("API validation contracts", () => {
  it("accepts username or displayName and normalizes both names", () => {
    const parsed = signupSchema.parse({
      email: "USER@Example.COM",
      password: "dev-password-1234",
      username: "defender",
    });

    expect(parsed.email).toBe("user@example.com");
    expect(parsed.username).toBe("defender");
    expect(parsed.displayName).toBe("defender");
  });

  it("uses game_saves field names in the save API", () => {
    const parsed = upsertGameSaveSchema.parse({
      name: "Day 7 Harbor",
      mapId: "map_default_bay",
      gameVersion: "pr1",
      day: 7,
      state: { cash: 1200 },
    });

    expect(parsed.mapId).toBe("map_default_bay");
    expect(parsed.day).toBe(7);
  });

  it("requires a stable idempotency key for gacha rolls", () => {
    expect(() =>
      gachaRollSchema.parse({
        bannerId: "banner_pr1_defenders",
        pullCount: 10,
        idempotencyKey: "short",
      }),
    ).toThrow();
  });
});

describe("gacha service", () => {
  it("forces a legendary result at the pity threshold", () => {
    const roll = resolveGachaRoll({
      pullCount: 1,
      pityBefore: 49,
      pityThreshold: 50,
      randomUint32: () => 0,
      rates: [
        { itemKey: "card.common", name: "Common", rarity: "N", weight: 100 },
        { itemKey: "card.legendary", name: "Legendary", rarity: "UR", weight: 1 },
      ],
    });

    expect(roll.results).toEqual([{ itemKey: "card.legendary", name: "Legendary", rarity: "UR" }]);
    expect(roll.pityAfter).toBe(0);
  });

  it("increments pity after non-legendary results", () => {
    const roll = resolveGachaRoll({
      pullCount: 10,
      pityBefore: 3,
      pityThreshold: 50,
      randomUint32: () => 0,
      rates: [{ itemKey: "card.common", name: "Common", rarity: "N", weight: 100 }],
    });

    expect(roll.results).toHaveLength(10);
    expect(roll.pityAfter).toBe(13);
  });
});
