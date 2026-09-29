import { describe, expect, it } from "vitest";
import { publicSecurityHeaders } from "./security-headers";

describe("public response security headers", () => {
  it("protects content interpretation, framing, referrers and device capabilities", () => {
    const headers = Object.fromEntries(publicSecurityHeaders.map(({ key, value }) => [key, value]));

    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("SAMEORIGIN");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Permissions-Policy"]).toContain("camera=()");
    expect(headers["Permissions-Policy"]).toContain("microphone=()");
    expect(headers["Cross-Origin-Opener-Policy"]).toBe("same-origin");
  });

  it("keeps every header unique", () => {
    const names = publicSecurityHeaders.map(({ key }) => key.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });
});
