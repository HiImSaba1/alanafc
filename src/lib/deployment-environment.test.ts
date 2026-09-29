import { describe, expect, it } from "vitest";
import { auditDeploymentEnvironment } from "./deployment-environment";

const valid = {
  DATABASE_NAME: "papaki_alana_database",
  DATABASE_URL: "mysql://alana_owner:strong-db-secret@db.internal:3306/papaki_alana_database",
  SESSION_SECRET: "a-secure-session-secret-with-32-chars",
  ADMIN_USERNAME: "AlanaOwner",
  ADMIN_PASSWORD: "a-long-owner-password",
  SMTP_HOST: "smtp.host.test",
  SMTP_PORT: "465",
  SMTP_SECURE: "true",
  SMTP_USER: "info@alanafc.gr",
  SMTP_PASSWORD: "a-private-mail-password",
  MAIL_FROM: "Alana FC Academy <info@alanafc.gr>",
  MAIL_TO: "f.c.alana@hotmail.com, alanafcmedia@gmail.com",
  NEXT_PUBLIC_SITE_URL: "https://alanafc.gr",
};

describe("deployment environment audit", () => {
  it("accepts a complete production-safe contract", () => {
    expect(auditDeploymentEnvironment(valid, "production")).toMatchObject({ ok: true, databaseConfigured: true, adminConfigured: true, smtpConfigured: true, recipientCount: 2, publicUrlConfigured: true });
  });

  it("allows the local root database while keeping every other boundary", () => {
    expect(auditDeploymentEnvironment({ ...valid, DATABASE_NAME: undefined, DATABASE_URL: "mysql://root@127.0.0.1:3306/next_alanafcacademy", NEXT_PUBLIC_SITE_URL: undefined }, "local").ok).toBe(true);
  });

  it("reports field contracts without exposing their values", () => {
    const secret = "do-not-print-this-secret";
    const report = auditDeploymentEnvironment({ ...valid, ADMIN_PASSWORD: secret, DATABASE_URL: "mysql://root@db.internal:3306/wrong_database", MAIL_TO: "missing@recipient.test" }, "production");
    expect(report.ok).toBe(false);
    expect(report.errors.join(" ")).not.toContain(secret);
    expect(report.errors.join(" ")).toContain("configured DATABASE_NAME");
    expect(report.errors.join(" ")).toContain("required academy recipient");
  });
});
