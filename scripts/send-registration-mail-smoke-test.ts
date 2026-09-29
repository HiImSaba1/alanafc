import { existsSync } from "node:fs";
import process from "node:process";
import nodemailer from "nodemailer";
import { registrationMailMessages } from "../src/features/registrations/mail-messages";
import { academyMailConfiguration } from "../src/lib/mail/configuration";

const guardianRecipient = "pavlossaba@gmail.com";
const ownerRecipient = "paulsaba1710@gmail.com";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

async function main() {
  if (!process.argv.includes("--confirm-send-registration-test")) throw new Error("Refusing to send without --confirm-send-registration-test.");
  const configuration = academyMailConfiguration({ ...process.env, MAIL_TO: ownerRecipient });
  const transporter = nodemailer.createTransport({
    host: configuration.host, port: configuration.port, secure: configuration.secure,
    auth: { user: configuration.user, pass: configuration.password },
    connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000,
  });
  const reference = `AL-MAIL-TEST-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}`;
  const messages = registrationMailMessages({
    childName: "Δοκιμαστική εγγραφή", childBirthYear: 2016, preferredGroup: "K10",
    guardianName: "Pavlos Saba", guardianRelationship: "Γονέας",
    guardianEmail: guardianRecipient, guardianPhone: "+30 6900000000",
    address: "Δοκιμαστική διεύθυνση", notes: "Ελεγχόμενο SMTP smoke test — δεν αποτελεί πραγματική εγγραφή.",
    photoPreference: "no", privacyConsent: "yes", website: "",
  }, reference);

  try {
    await transporter.verify();
    const ownerResult = await transporter.sendMail({ from: configuration.from, to: ownerRecipient, replyTo: guardianRecipient, ...messages.owner });
    const guardianResult = await transporter.sendMail({ from: configuration.from, to: guardianRecipient, ...messages.guardian });
    const accepted = [ownerResult, guardianResult].map((result) => Array.isArray(result.accepted) ? result.accepted.length : 0);
    const rejected = [ownerResult, guardianResult].map((result) => Array.isArray(result.rejected) ? result.rejected.length : 0);
    if (accepted.some((count) => count < 1) || rejected.some((count) => count > 0)) throw new Error("The SMTP provider did not accept both registration test messages.");
    process.stdout.write(`${JSON.stringify({ ok: true, authenticated: true, messagesSent: 2, ownerAccepted: true, guardianAccepted: true, secretsPrinted: false }, null, 2)}\n`);
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
  process.stderr.write("Registration mail smoke test failed. No credential, recipient, provider response, or message identifier was printed.\n");
  process.exitCode = 1;
});
