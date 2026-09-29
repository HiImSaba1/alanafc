import { describe, expect, it } from "vitest";
import { academyMailConfiguration } from "./configuration";

const valid = {
  SMTP_HOST: "mail.host.test",
  SMTP_PORT: "465",
  SMTP_SECURE: "true",
  SMTP_USER: "info@alanafc.gr",
  SMTP_PASSWORD: "private-password",
  MAIL_FROM: "Alana FC Academy <info@alanafc.gr>",
  MAIL_TO: "f.c.alana@hotmail.com, alanafcmedia@gmail.com",
};

describe("academy mail configuration", () => {
  it("normalizes one authenticated sender and multiple recipients", () => {
    expect(academyMailConfiguration(valid)).toMatchObject({ port: 465, secure: true, user: "info@alanafc.gr", recipients: ["f.c.alana@hotmail.com", "alanafcmedia@gmail.com"] });
  });

  it("rejects invalid ports, TLS values, and sender mismatch", () => {
    expect(() => academyMailConfiguration({ ...valid, SMTP_PORT: "invalid" })).toThrow("θύρα SMTP");
    expect(() => academyMailConfiguration({ ...valid, SMTP_SECURE: "maybe" })).toThrow("ασφάλειας SMTP");
    expect(() => academyMailConfiguration({ ...valid, MAIL_FROM: "other@alanafc.gr" })).toThrow("SMTP λογαριασμό");
  });
});
