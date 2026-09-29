export const COOKIE_CONSENT_KEY = "alanafc_cookie_consent_v1";
export const COOKIE_POLICY_VERSION = 1;
export const COOKIE_CONSENT_MAX_AGE_DAYS = 180;

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const CLOCK_SKEW_TOLERANCE_MS = 5 * 60 * 1000;

export type CookieConsentChoice = "accepted" | "declined";

type StoredCookieConsent = {
  choice: CookieConsentChoice;
  policyVersion: number;
  savedAt: string;
};

export function readCookieConsent(raw: string | null, now = new Date()): CookieConsentChoice | null {
  if (raw === "accepted" || raw === "declined") return raw;
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<StoredCookieConsent>;
    if (value.policyVersion !== COOKIE_POLICY_VERSION) return null;
    if (value.choice !== "accepted" && value.choice !== "declined") return null;
    const savedAt = typeof value.savedAt === "string" ? Date.parse(value.savedAt) : Number.NaN;
    const age = now.getTime() - savedAt;
    if (!Number.isFinite(savedAt) || age < -CLOCK_SKEW_TOLERANCE_MS || age > COOKIE_CONSENT_MAX_AGE_DAYS * DAY_IN_MS) return null;
    return value.choice;
  } catch {
    return null;
  }
}

export function serializeCookieConsent(choice: CookieConsentChoice, now = new Date()): string {
  return JSON.stringify({ choice, policyVersion: COOKIE_POLICY_VERSION, savedAt: now.toISOString() } satisfies StoredCookieConsent);
}

type ConsentStorage = Pick<Storage, "getItem" | "removeItem">;

export function loadCookieConsent(storage: ConsentStorage, now = new Date()): CookieConsentChoice | null {
  const raw = storage.getItem(COOKIE_CONSENT_KEY);
  const choice = readCookieConsent(raw, now);
  if (raw !== null && choice === null) storage.removeItem(COOKIE_CONSENT_KEY);
  return choice;
}
