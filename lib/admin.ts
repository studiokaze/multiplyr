import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Admin gate. One shared secret in ADMIN_KEY; the session cookie carries a
 * hash of it (never the key), so the cookie is useless anywhere else and all
 * sessions die at once when the key is rotated.
 */

export const ADMIN_COOKIE = "mp_admin";

function keyHash(key: string): string {
  return createHash("sha256").update(`multiplyer-admin:${key}`).digest("hex");
}

function configuredKey(): string | null {
  const key = process.env.ADMIN_KEY;
  return key && key.length >= 16 ? key : null;
}

/** Does a submitted key match? Timing-safe; false when no key is configured. */
export function checkKey(submitted: string): boolean {
  const key = configuredKey();
  if (!key) return false;
  const a = Buffer.from(keyHash(submitted));
  const b = Buffer.from(keyHash(key));
  return a.length === b.length && timingSafeEqual(a, b);
}

/** The value a valid session cookie must hold. Null when gate is unset. */
export function sessionValue(): string | null {
  const key = configuredKey();
  return key ? keyHash(key) : null;
}

/** Does a cookie prove a valid session? */
export function checkSession(cookie: string | undefined): boolean {
  const expected = sessionValue();
  if (!expected || !cookie) return false;
  const a = Buffer.from(cookie);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
