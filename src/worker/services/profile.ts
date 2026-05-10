import type { UpdateProfileInput, UpsertGameSaveInput } from "../../shared/validation";
import { nowIso } from "../crypto";
import { SqlDatabase } from "../db";
import { ApiError } from "../http/errors";

export async function updateProfile(db: SqlDatabase, userId: string, input: UpdateProfileInput) {
  const now = nowIso();
  const profile = await db.updateProfile({ userId, ...input, now });
  if (!profile) {
    throw new ApiError(404, "not_found", "Profile was not found");
  }
  await db.audit({
    actorUserId: userId,
    action: "profile.update",
    entityType: "user_profile",
    entityId: userId,
    metadata: input,
    now,
  });
  return profile;
}

export async function upsertGameSave(db: SqlDatabase, userId: string, input: UpsertGameSaveInput) {
  const now = nowIso();
  const save = await db.upsertGameSave({ userId, ...input, now });
  await db.audit({
    actorUserId: userId,
    action: "save.upsert",
    entityType: "game_save",
    entityId: save.id,
    metadata: { name: input.name, mapId: input.mapId, gameVersion: input.gameVersion, day: input.day },
    now,
  });
  return save;
}

export async function deleteGameSave(db: SqlDatabase, userId: string, id: string): Promise<void> {
  const now = nowIso();
  const deleted = await db.deleteGameSave(userId, id);
  if (!deleted) {
    throw new ApiError(404, "not_found", "Game save was not found");
  }
  await db.audit({
    actorUserId: userId,
    action: "save.delete",
    entityType: "game_save",
    entityId: id,
    metadata: {},
    now,
  });
}
