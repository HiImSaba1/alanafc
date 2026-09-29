import { describe, expect, it } from "vitest";
import { registrationMailMessages } from "./mail-messages";

describe("registrationMailMessages", () => {
  it("builds the owner details and the guardian thank-you message", () => {
    const messages = registrationMailMessages({
      childName: "Δοκιμαστικό Παιδί", childBirthYear: 2016, preferredGroup: "K10",
      guardianName: "Δοκιμαστικός Κηδεμόνας", guardianRelationship: "Γονέας",
      guardianEmail: "parent@example.test", guardianPhone: "+30 6900000000",
      address: "", notes: "Δοκιμαστική υποβολή", photoPreference: "no",
      privacyConsent: "yes", website: "",
    }, "AL-TEST-MAIL");

    expect(messages.owner.text).toContain("Δοκιμαστικό Παιδί");
    expect(messages.owner.text).toContain("parent@example.test");
    expect(messages.guardian.text).toContain("σας συγχαίρουμε");
    expect(messages.guardian.text).toContain("AL-TEST-MAIL");
    expect(messages.guardian.html).not.toContain("<script");
  });
});
