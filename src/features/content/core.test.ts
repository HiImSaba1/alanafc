import { describe, expect, it } from "vitest";
import { conciseGreeklishSlug, isPubliclyVisible, normalizeContentSlug, normalizeGreekTitleConjunctions, publicationFromIntent, removeLegacyEmojiImages, sanitizeEditorHtml, suggestGreeklishSlug } from "./core";

describe("content publication boundary", () => {
  it("never exposes quarantine, drafts, or future schedules", () => {
    const now = new Date("2026-09-19T10:00:00Z");
    expect(isPubliclyVisible({ migrationStatus: "quarantined", publicationStatus: "published" }, now)).toBe(false);
    expect(isPubliclyVisible({ migrationStatus: "draft", publicationStatus: "draft" }, now)).toBe(false);
    expect(isPubliclyVisible({ migrationStatus: "draft", publicationStatus: "scheduled", scheduledFor: new Date("2026-09-20T10:00:00Z") }, now)).toBe(false);
    expect(isPubliclyVisible({ migrationStatus: "draft", publicationStatus: "scheduled", scheduledFor: new Date("2026-09-18T10:00:00Z") }, now)).toBe(true);
  });

  it("normalizes Greek slugs and removes active markup", () => {
    expect(normalizeContentSlug(" Νέα Ακαδημίας! ")).toBe("νέα-ακαδημίας");
    expect(sanitizeEditorHtml('<p onclick="bad()">Κείμενο</p><script>bad()</script>')).toBe("<p>Κείμενο</p>");
  });

  it("suggests stable ASCII slugs for Greek article titles", () => {
    expect(suggestGreeklishSlug("Νέα Ακαδημίας 2026!")).toBe("nea-akadimias-2026");
    expect(conciseGreeklishSlug("Στην προεπιλογή της εθνικής Ελλάδος U14")).toBe("stin-proepilogi-tis-ethnikis-ellados-u14");
    expect(normalizeGreekTitleConjunctions("Βεγλέκτσης &amp; Διαμαντάκης")).toBe("Βεγλέκτσης και Διαμαντάκης");
    expect(conciseGreeklishSlug("Βεγλέκτσης &amp; Διαμαντάκης")).toBe("veglektsis-and-diamantakis");
    expect(conciseGreeklishSlug("Ένας εξαιρετικά μεγάλος τίτλος ".repeat(10)).length).toBeLessThanOrEqual(80);
  });

  it("removes Facebook-hosted legacy emoji images without removing local content images", () => {
    const emoji = '<p>Ευχαριστούμε <img src="https://static.xx.fbcdn.net/images/emoji.php/v9/t80/1/16/1f64f.png" alt="🙏" width="16" height="16"></p>';
    expect(removeLegacyEmojiImages(emoji)).toBe("<p>Ευχαριστούμε </p>");
    expect(removeLegacyEmojiImages('<img src="/uploads/media/team.webp" alt="Ομάδα">')).toContain("team.webp");
  });

  it("rejects schedules that are not in the future", () => {
    expect(() => publicationFromIntent("schedule", new Date(0))).toThrow(/μέλλον/);
    expect(publicationFromIntent("publish", null).status).toBe("published");
  });
});
