import { describe, expect, it } from "vitest";
import { hashSessionToken, nextFailureState, normalizeUsername, sessionExpiry } from "./core";

describe("admin authentication primitives", () => {
  it("normalizes administrator usernames", () => {
    expect(normalizeUsername(" AlanaOwner ")).toBe("alanaowner");
  });

  it("hashes opaque tokens without retaining the token", () => {
    expect(hashSessionToken("secret-token")).toMatch(/^[a-f0-9]{64}$/);
    expect(hashSessionToken("secret-token")).not.toContain("secret-token");
  });

  it("locks the account on the fifth failed attempt", () => {
    const now = new Date("2026-09-19T09:00:00.000Z");
    expect(nextFailureState(3, now)).toEqual({ failedLoginCount: 4, lockedUntil: null });
    const locked = nextFailureState(4, now);
    expect(locked.failedLoginCount).toBe(0);
    expect(locked.lockedUntil?.toISOString()).toBe("2026-09-19T09:15:00.000Z");
  });

  it("creates an eight-hour session window", () => {
    expect(sessionExpiry(new Date("2026-09-19T09:00:00.000Z")).toISOString())
      .toBe("2026-09-19T17:00:00.000Z");
  });
});
