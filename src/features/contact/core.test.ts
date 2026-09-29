import { describe, expect, it } from "vitest";
import { contactReference, contactSchema, contactSubmissionDecision, contactWindowStart } from "./core";
const valid = { senderName: "Μαρία Παπαδοπούλου", senderEmail: "MARIA@example.com", senderPhone: "697 123 4567", subject: "Πληροφορίες προπόνησης", message: "Θα ήθελα περισσότερες πληροφορίες.", privacyConsent: "yes", website: "" };
describe("contact contract", () => {
  it("normalizes a valid message", () => expect(contactSchema.parse(valid).senderEmail).toBe("maria@example.com"));
  it("rejects short messages and bot fields", () => { expect(contactSchema.safeParse({ ...valid, message: "Γεια" }).success).toBe(false); expect(contactSchema.safeParse({ ...valid, website: "spam" }).success).toBe(false); });
  it("creates a safe reference", () => expect(contactReference(new Date("2026-09-19T10:00:00Z"), "abcdef00-0000-0000-0000-000000000000")).toBe("MSG-20260919-ABCDEF"));
  it("suppresses duplicates before applying the submission ceiling", () => {
    expect(contactSubmissionDecision(1, 3)).toBe("duplicate");
    expect(contactSubmissionDecision(0, 3)).toBe("rate-limited");
    expect(contactSubmissionDecision(0, 2)).toBe("accept");
  });
  it("calculates deterministic database windows", () => expect(contactWindowStart(new Date("2026-09-19T12:00:00.000Z"), 10).toISOString()).toBe("2026-09-19T11:50:00.000Z"));
});
