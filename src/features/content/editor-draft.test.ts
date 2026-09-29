import { describe, expect, it } from "vitest";
import { parseEditorialDraft } from "./editor-draft";

describe("editorial draft recovery", () => {
  it("restores a valid browser draft only when it differs from the database", () => {
    const raw = JSON.stringify({ bodyHtml: "<p>Νεότερο κείμενο</p>", savedAt: "2026-09-20T10:00:00.000Z" });
    expect(parseEditorialDraft(raw, "<p>Κείμενο βάσης</p>")?.bodyHtml).toContain("Νεότερο");
    expect(parseEditorialDraft(raw, "<p>Νεότερο κείμενο</p>")).toBeNull();
  });

  it("rejects corrupt and malformed local values", () => {
    expect(parseEditorialDraft("not-json", "")).toBeNull();
    expect(parseEditorialDraft(JSON.stringify({ bodyHtml: 12, savedAt: "never" }), "")).toBeNull();
  });
});
