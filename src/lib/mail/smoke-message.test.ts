import { describe, expect, it } from "vitest";
import { academyMailSmokeMessage } from "./smoke-message";

describe("academy mail smoke message", () => {
  it("is explicitly marked as a test and contains no form data", () => {
    const message = academyMailSmokeMessage(new Date("2026-09-20T12:00:00.000Z"));
    expect(message.subject).toContain("[ΔΟΚΙΜΗ]");
    expect(message.text).toContain("Δεν απαιτείται απάντηση");
    expect(message.html).toContain("δεν περιέχει δεδομένα φόρμας");
    expect(message.html).toContain("2026-09-20T12:00:00.000Z");
  });
});
