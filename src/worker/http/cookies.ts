export function parseCookie(header: string | null, name: string): string | null {
  if (!header) {
    return null;
  }

  for (const part of header.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (rawKey === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return null;
}

export function sessionCookieName(env: { SESSION_COOKIE_NAME?: string }): string {
  return env.SESSION_COOKIE_NAME ?? "bankruptcy_defense_session";
}

export function buildSessionCookie(
  name: string,
  token: string,
  expiresAt: Date,
  isProduction: boolean,
): string {
  const attributes = [
    `${name}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Expires=${expiresAt.toUTCString()}`,
    "Max-Age=2592000",
  ];

  if (isProduction) {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}

export function clearSessionCookie(name: string, isProduction: boolean): string {
  const attributes = [
    `${name}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Max-Age=0",
  ];

  if (isProduction) {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}
