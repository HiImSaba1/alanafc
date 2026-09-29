import { describe, expect, it } from "vitest";
import { registrationReference, registrationSchema, registrationSubmissionDecision, registrationWindowStart } from "./core";

const valid = { childName: "Νίκος Παπαδόπουλος", childBirthYear: 2017, preferredGroup: "K10", guardianName: "Μαρία Παπαδοπούλου", guardianRelationship: "Μητέρα", guardianEmail: "MARIA@example.com", guardianPhone: "697 123 4567", photoPreference: "no", privacyConsent: "yes", website: "" };

describe("registration contract", () => {
  it("normalizes and accepts the minimum safe registration record", () => {
    const result = registrationSchema.parse(valid);
    expect(result.guardianEmail).toBe("maria@example.com");
  });
  it("rejects missing consent and bot honeypot values", () => {
    expect(registrationSchema.safeParse({ ...valid, privacyConsent: undefined }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...valid, website: "spam" }).success).toBe(false);
  });
  it("creates a non-identifying operational reference", () => {
    expect(registrationReference(new Date("2026-09-19T10:00:00Z"), "abcdef00-0000-0000-0000-000000000000")).toBe("AL-20260919-ABCDEF");
  });
  it("suppresses recent duplicates before applying the submission ceiling", () => {
    expect(registrationSubmissionDecision(1, 3)).toBe("duplicate");
    expect(registrationSubmissionDecision(0, 3)).toBe("rate-limited");
    expect(registrationSubmissionDecision(0, 2)).toBe("accept");
  });
  it("calculates deterministic database windows", () => {
    expect(registrationWindowStart(new Date("2026-09-19T12:00:00.000Z"), 15).toISOString()).toBe("2026-09-19T11:45:00.000Z");
  });
});
