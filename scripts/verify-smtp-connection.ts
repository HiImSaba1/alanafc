import { existsSync } from "node:fs";
import process from "node:process";
import nodemailer from "nodemailer";
import { academyMailConfiguration } from "../src/lib/mail/configuration";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

async function main() {
  const configuration = academyMailConfiguration();
  const transporter = nodemailer.createTransport({
    host: configuration.host,
    port: configuration.port,
    secure: configuration.secure,
    auth: { user: configuration.user, pass: configuration.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  try {
    await transporter.verify();
    process.stdout.write(`${JSON.stringify({ ok: true, authenticated: true, secureTransport: configuration.secure, recipientCount: configuration.recipients.length, messagesSent: 0 }, null, 2)}\n`);
  } finally {
    transporter.close();
  }
}

main().catch((error: unknown) => {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "UNKNOWN";
  const category = code === "EAUTH" ? "authentication" : code === "ETIMEDOUT" || code === "ESOCKET" ? "timeout-or-socket" : code === "ECONNECTION" || code === "ECONNREFUSED" ? "connection" : code.startsWith("CERT_") ? "tls-certificate" : "unknown";
  process.stderr.write(`SMTP verification failed (${category}). Check host, port, TLS mode, username, password, and provider access. No credential values were printed and no message was sent.\n`);
  process.exitCode = 1;
});
