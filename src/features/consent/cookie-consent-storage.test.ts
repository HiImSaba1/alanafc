import { describe, expect, it } from "vitest";
import { COOKIE_CONSENT_KEY, loadCookieConsent, readCookieConsent, serializeCookieConsent } from "./cookie-consent-storage";

describe("cookie consent storage", () => {
  it("keeps legacy choices compatible", () => {
    expect(readCookieConsent("accepted")).toBe("accepted");
    expect(readCookieConsent("declined")).toBe("declined");
  });

  it("round-trips the current policy version", () => {
    const now = new Date("2026-09-20T12:00:00.000Z");
    const stored = serializeCookieConsent("accepted", now);
    expect(readCookieConsent(stored, now)).toBe("accepted");
    expect(JSON.parse(stored)).toEqual({ choice: "accepted", policyVersion: 1, savedAt: "2026-09-20T12:00:00.000Z" });
  });

  it("rejects malformed and obsolete records", () => {
    expect(readCookieConsent("broken-json")).toBeNull();
    expect(readCookieConsent(JSON.stringify({ choice: "accepted", policyVersion: 0, savedAt: "old" }))).toBeNull();
    expect(readCookieConsent(JSON.stringify({ choice: "maybe", policyVersion: 1, savedAt: "now" }))).toBeNull();
  });

  it("renews expired consent and rejects implausible future timestamps", () => {
    const now = new Date("2026-09-20T12:00:00.000Z");
    const expired = serializeCookieConsent("accepted", new Date("2026-03-20T11:59:59.000Z"));
    const future = serializeCookieConsent("declined", new Date("2026-09-20T12:06:00.000Z"));

    expect(readCookieConsent(expired, now)).toBeNull();
    expect(readCookieConsent(future, now)).toBeNull();
  });

  it("removes invalid records while preserving valid consent", () => {
    let stored: string | null = "broken-json";
    const storage = {
      getItem: (key: string) => key === COOKIE_CONSENT_KEY ? stored : null,
      removeItem: (key: string) => { if (key === COOKIE_CONSENT_KEY) stored = null; },
    };

    expect(loadCookieConsent(storage)).toBeNull();
    expect(stored).toBeNull();

    stored = "declined";
    expect(loadCookieConsent(storage)).toBe("declined");
    expect(stored).toBe("declined");
  });
});
