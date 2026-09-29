import { createHash, randomBytes } from "node:crypto";

export const SESSION_COOKIE = "alana_admin_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 8;
export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MINUTES = 15;

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionExpiry(now = new Date()): Date {
  return new Date(now.getTime() + SESSION_DURATION_SECONDS * 1000);
}

export function nextFailureState(failedLoginCount: number, now = new Date()) {
  const nextCount = failedLoginCount + 1;
  return {
    failedLoginCount: nextCount >= MAX_FAILED_LOGINS ? 0 : nextCount,
    lockedUntil: nextCount >= MAX_FAILED_LOGINS
      ? new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000)
      : null,
  };
}
