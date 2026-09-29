import { existsSync } from "node:fs";
import process from "node:process";
import nodemailer from "nodemailer";
import { academyMailConfiguration } from "../src/lib/mail/configuration";
import { academyMailSmokeMessage } from "../src/lib/mail/smoke-message";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

async function main() {
  if (!process.argv.includes("--confirm-send-smoke-test")) throw new Error("Refusing to send without --confirm-send-smoke-test.");
  const configuration = academyMailConfiguration();
  const recipient = configuration.recipients[0];
  if (!recipient) throw new Error("No administrative smoke-test recipient is configured.");
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
    const message = academyMailSmokeMessage();
    const result = await transporter.sendMail({ from: configuration.from, to: recipient, subject: message.subject, text: message.text, html: message.html, headers: { "X-Auto-Response-Suppress": "All" } });
    const accepted = Array.isArray(result.accepted) ? result.accepted.length : 0;
    const rejected = Array.isArray(result.rejected) ? result.rejected.length : 0;
    if (accepted < 1 || rejected > 0) throw new Error("The SMTP provider did not accept the single smoke-test delivery.");
    process.stdout.write(`${JSON.stringify({ ok: true, messagesSent: 1, acceptedRecipients: accepted, rejectedRecipients: rejected, recipientPosition: 1 }, null, 2)}\n`);
  } finally {
    transporter.close();
  }
}

main().catch((error: unknown) => {
  const details = typeof error === "object" && error !== null ? error as { code?: unknown; command?: unknown; responseCode?: unknown } : {};
  const code = String(details.code ?? "UNKNOWN");
  const command = String(details.command ?? "").toUpperCase();
  const responseCode = typeof details.responseCode === "number" ? details.responseCode : null;
  const category = code === "EAUTH" || command.startsWith("AUTH") ? "authentication" : command.startsWith("MAIL") ? "sender-rejected" : command.startsWith("RCPT") || code === "EENVELOPE" ? "recipient-rejected" : code === "ETIMEDOUT" || code === "ESOCKET" ? "timeout-or-socket" : code === "ECONNECTION" || code === "ECONNREFUSED" ? "connection" : code.startsWith("CERT_") ? "tls-certificate" : "unknown";
  process.stderr.write(`${JSON.stringify({ ok: false, category, smtpStatus: responseCode, messagesSent: 0, secretsPrinted: false }, null, 2)}\n`);
  process.stderr.write("SMTP smoke test failed. No credential, recipient, provider response, or message identifier was printed.\n");
  process.exitCode = 1;
});
