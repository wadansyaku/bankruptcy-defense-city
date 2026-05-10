import type { GachaRateEntry, GachaRollResult } from "../../shared/apiTypes";
import type { GachaRollInput } from "../../shared/validation";
import { nowIso } from "../crypto";
import { SqlDatabase } from "../db";
import { ApiError } from "../http/errors";

const LEGENDARY = "UR";

export async function rollGacha(
  db: SqlDatabase,
  userId: string,
  input: GachaRollInput,
): Promise<GachaRollResult> {
  const existing = await db.findRollByIdempotencyKey(userId, input.idempotencyKey);
  if (existing) {
    return existing;
  }

  const now = nowIso();
  const banner = await db.getBanner(input.bannerId, now);
  if (!banner) {
    throw new ApiError(404, "not_found", "Gacha banner was not found");
  }
  if (banner.rates.length === 0) {
    throw new ApiError(409, "conflict", "Gacha banner has no rates");
  }

  const cost = banner.cost * input.pullCount;
  const spent = await db.spendGachaCurrency(userId, cost, now);
  if (!spent) {
    throw new ApiError(409, "conflict", "Not enough free in-game currency");
  }

  const pityBefore = await db.getPityCounter(userId, banner.id);
  const resolved = resolveGachaRoll({
    rates: banner.rates,
    pullCount: input.pullCount,
    pityBefore,
    pityThreshold: banner.pityThreshold,
  });

  try {
    const roll = await db.recordGachaRoll({
      userId,
      bannerId: banner.id,
      idempotencyKey: input.idempotencyKey,
      pullCount: input.pullCount,
      cost,
      pityBefore,
      pityAfter: resolved.pityAfter,
      results: resolved.results,
      now,
    });
    await db.audit({
      actorUserId: userId,
      action: "gacha.pull",
      entityType: "gacha_banner",
      entityId: banner.id,
      metadata: {
        rollId: roll.rollId,
        pullCount: input.pullCount,
        cost,
        idempotencyKey: input.idempotencyKey,
      },
      now,
    });
    return roll;
  } catch (error) {
    await db.refundGachaCurrency(userId, cost, now);
    const existingAfterRace = await db.findRollByIdempotencyKey(userId, input.idempotencyKey);
    if (existingAfterRace) {
      return existingAfterRace;
    }
    throw error;
  }
}

export function resolveGachaRoll(input: {
  rates: GachaRateEntry[];
  pullCount: 1 | 10;
  pityBefore: number;
  pityThreshold: number;
  randomUint32?: () => number;
}): { results: Array<Omit<GachaRateEntry, "weight">>; pityAfter: number } {
  const legendaryRates = input.rates.filter((entry) => entry.rarity === LEGENDARY);
  const randomUint32 = input.randomUint32 ?? secureUint32;
  const results: Array<Omit<GachaRateEntry, "weight">> = [];
  let pity = input.pityBefore;

  for (let index = 0; index < input.pullCount; index += 1) {
    const forceLegendary = input.pityThreshold > 0 && pity + 1 >= input.pityThreshold && legendaryRates.length > 0;
    const entry = pickWeighted(forceLegendary ? legendaryRates : input.rates, randomUint32);
    results.push(stripWeight(entry));
    pity = entry.rarity === LEGENDARY ? 0 : pity + 1;
  }

  return { results, pityAfter: pity };
}

function pickWeighted<T extends { weight: number }>(rates: T[], randomUint32: () => number): T {
  const totalWeight = rates.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
  if (totalWeight <= 0) {
    throw new ApiError(409, "conflict", "Gacha rates have no positive weights");
  }

  let ticket = randomUint32() % totalWeight;
  for (const entry of rates) {
    ticket -= Math.max(0, entry.weight);
    if (ticket < 0) {
      return entry;
    }
  }

  return rates[rates.length - 1];
}

function secureUint32(): number {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0];
}

function stripWeight(entry: GachaRateEntry): Omit<GachaRateEntry, "weight"> {
  const { weight: _weight, ...result } = entry;
  return result;
}
