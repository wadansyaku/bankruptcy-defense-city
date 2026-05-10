import type { Context } from "hono";
import type { z, ZodSchema } from "zod";
import { ZodError } from "zod";
import { ApiError } from "./errors";
import type { AppBindings } from "../types";

export async function parseJson<TSchema extends z.ZodTypeAny>(
  c: Context<AppBindings>,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new ApiError(400, "bad_request", "Request body must be valid JSON");
  }

  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ApiError(400, "validation_failed", "Request validation failed", error.flatten());
    }
    throw error;
  }
}

export function parseParams<T>(value: unknown, schema: ZodSchema<T>): T {
  try {
    return schema.parse(value);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ApiError(400, "validation_failed", "Route parameter validation failed", error.flatten());
    }
    throw error;
  }
}
