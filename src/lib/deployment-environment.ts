export type DeploymentMode = "local" | "production";

type EnvironmentValues = Record<string, string | undefined>;

export type DeploymentEnvironmentReport = {
  ok: boolean;
  mode: DeploymentMode;
  databaseConfigured: boolean;
  adminConfigured: boolean;
  smtpConfigured: boolean;
  recipientCount: number;
  publicUrlConfigured: boolean;
  errors: string[];
};

const placeholderPattern = /replace-with|change-me|changeme|passwordnotshown|example\.com/i;
const requiredRecipients = ["f.c.alana@hotmail.com", "alanafcmedia@gmail.com"];

function present(value: string | undefined) {
  return Boolean(value?.trim()) && !placeholderPattern.test(value ?? "");
}

export function auditDeploymentEnvironment(values: EnvironmentValues, mode: DeploymentMode): DeploymentEnvironmentReport {
  const errors: string[] = [];
  const databaseUrl = values.DATABASE_URL?.trim();
  const configuredDatabaseName = values.DATABASE_NAME?.trim();
  const expectedDatabaseName = configuredDatabaseName || "next_alanafcacademy";
  let databaseConfigured = false;

  if (mode === "production" && !present(configuredDatabaseName)) errors.push("DATABASE_NAME is missing or uses a placeholder.");

  if (!databaseUrl || !present(databaseUrl)) errors.push("DATABASE_URL is missing or uses a placeholder.");
  else {
    try {
      const parsed = new URL(databaseUrl);
      const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
      if (parsed.protocol !== "mysql:") errors.push("DATABASE_URL must use mysql://.");
      if (database !== expectedDatabaseName) errors.push("DATABASE_URL must target the configured DATABASE_NAME.");
      if (mode === "production" && (!parsed.username || !parsed.password || parsed.username.toLowerCase() === "root")) errors.push("Production DATABASE_URL requires a dedicated non-root user and password.");
      databaseConfigured = parsed.protocol === "mysql:" && database === expectedDatabaseName;
    } catch {
      errors.push("DATABASE_URL is not a valid URL.");
    }
  }

  const sessionSecret = values.SESSION_SECRET?.trim() ?? "";
  const adminUsername = values.ADMIN_USERNAME?.trim() ?? "";
  const adminPassword = values.ADMIN_PASSWORD ?? "";
  if (!present(sessionSecret) || sessionSecret.length < 32) errors.push("SESSION_SECRET must contain at least 32 non-placeholder characters.");
  if (!present(adminUsername)) errors.push("ADMIN_USERNAME is missing or uses a placeholder.");
  if (!present(adminPassword) || adminPassword.length < 14) errors.push("ADMIN_PASSWORD must contain at least 14 non-placeholder characters.");
  const adminConfigured = present(sessionSecret) && sessionSecret.length >= 32 && present(adminUsername) && present(adminPassword) && adminPassword.length >= 14;

  const smtpKeys = ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "MAIL_FROM", "MAIL_TO"] as const;
  const missingMailKeys = smtpKeys.filter((key) => !present(values[key]));
  if (missingMailKeys.length) errors.push(`Mail configuration is incomplete: ${missingMailKeys.join(", ")}.`);
  const smtpPort = Number(values.SMTP_PORT ?? "465");
  if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) errors.push("SMTP_PORT must be an integer between 1 and 65535.");
  if (values.SMTP_SECURE && !["true", "false"].includes(values.SMTP_SECURE.trim().toLowerCase())) errors.push("SMTP_SECURE must be true or false.");
  const smtpUser = values.SMTP_USER?.trim().toLowerCase() ?? "";
  const mailFrom = values.MAIL_FROM?.trim().toLowerCase() ?? "";
  if (smtpUser && mailFrom && !mailFrom.includes(smtpUser)) errors.push("MAIL_FROM must use the authenticated SMTP_USER address.");
  const recipients = (values.MAIL_TO ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  const missingRecipients = requiredRecipients.filter((recipient) => !recipients.includes(recipient));
  if (missingRecipients.length) errors.push(`MAIL_TO is missing ${missingRecipients.length} required academy recipient(s).`);
  const smtpConfigured = missingMailKeys.length === 0 && Number.isInteger(smtpPort) && smtpPort >= 1 && smtpPort <= 65535 && smtpUser !== "" && mailFrom.includes(smtpUser) && missingRecipients.length === 0;

  const publicUrl = values.NEXT_PUBLIC_SITE_URL?.trim();
  let publicUrlConfigured = false;
  if (publicUrl) {
    try {
      const parsed = new URL(publicUrl);
      publicUrlConfigured = parsed.protocol === "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1";
    } catch { publicUrlConfigured = false; }
  }
  if (mode === "production" && !publicUrlConfigured) errors.push("NEXT_PUBLIC_SITE_URL must be a public HTTPS URL in production.");

  return { ok: errors.length === 0, mode, databaseConfigured, adminConfigured, smtpConfigured, recipientCount: recipients.length, publicUrlConfigured, errors };
}
