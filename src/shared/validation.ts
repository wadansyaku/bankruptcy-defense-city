import { z } from "zod";
import type { JsonValue } from "./apiTypes";

const userFacingName = z.string().trim().min(1).max(40);
const id = z.string().trim().min(1).max(128);
const idempotencyKey = z.string().trim().min(12).max(128);
const turnstileToken = z.string().trim().min(1).max(2048).optional();
const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonValueSchema), z.record(jsonValueSchema)]),
);

export const signupSchema = z
  .object({
    email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
    password: z.string().min(10).max(256),
    name: userFacingName.optional(),
    username: userFacingName.optional(),
    displayName: userFacingName.optional(),
    turnstileToken,
  })
  .refine((value) => value.username ?? value.displayName ?? value.name, {
    message: "username, displayName, or name is required",
    path: ["username"],
  })
  .transform((value) => ({
    ...value,
    username: value.username ?? value.displayName ?? value.name ?? "",
    displayName: value.displayName ?? value.username ?? value.name ?? "",
  }));

export const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(256),
  turnstileToken,
});

export const updateProfileSchema = z.object({
  name: userFacingName.optional(),
  username: userFacingName.optional(),
  displayName: userFacingName.optional(),
  avatarAssetKey: id.nullable().optional(),
}).transform((value) => ({
  username: value.username ?? value.name,
  displayName: value.displayName ?? value.name,
  avatarAssetKey: value.avatarAssetKey,
}));

export const upsertGameSaveSchema = z.object({
  id: id.optional(),
  slot: z.number().int().min(1).max(5).optional().default(1),
  name: z.string().trim().min(1).max(80),
  mapId: id,
  gameVersion: z.string().trim().min(1).max(40),
  day: z.number().int().min(0).max(999_999),
  state: jsonValueSchema,
});

export const gachaRollSchema = z.object({
  bannerId: id,
  pullCount: z.union([z.literal(1), z.literal(10)]),
  idempotencyKey,
  turnstileToken,
});

export const routeIdSchema = z.object({ id });

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpsertGameSaveInput = {
  id?: string;
  slot?: number;
  name: string;
  mapId: string;
  gameVersion: string;
  day: number;
  state: JsonValue;
};
export type GachaRollInput = z.infer<typeof gachaRollSchema>;
