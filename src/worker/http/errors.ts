import type { Context } from "hono";
import type { ApiErrorCode, ApiFailure, ApiSuccess } from "../../shared/apiTypes";
import type { AppBindings } from "../types";

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: unknown;

  constructor(status: number, code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function ok<T>(c: Context<AppBindings>, data: T, status = 200): Response {
  const body: ApiSuccess<T> = { ok: true, data };
  return c.json(body, status as never);
}

export function fail(
  c: Context<AppBindings>,
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: unknown,
): Response {
  const body: ApiFailure = {
    ok: false,
    error: details === undefined ? { code, message } : { code, message, details },
  };
  return c.json(body, status as never);
}

export function toErrorResponse(c: Context<AppBindings>, error: Error): Response {
  if (error instanceof ApiError) {
    return fail(c, error.status, error.code, error.message, error.details);
  }

  console.error(JSON.stringify({ level: "error", message: error.message, stack: error.stack }));
  return fail(c, 500, "internal_error", "Unexpected server error");
}
