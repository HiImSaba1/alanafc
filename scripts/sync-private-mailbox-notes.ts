import { existsSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";

const productionPath = ".env.production.local";
const targets = [".env.production.local", ".env.local"];

function replaceSetting(source: string, key: string, value: string) {
  const line = `${key}=${JSON.stringify(value)}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  return pattern.test(source) ? source.replace(pattern, line) : `${source.trimEnd()}\n${line}\n`;
}

function privateValue(source: string, label: string) {
  const match = source.match(new RegExp(`^\\s*#?\\s*${label}\\s*:\\s*(.+?)\\s*$`, "im"));
  return match?.[1]?.trim() ?? "";
}

if (!process.argv.includes("--confirm-sync-private-mailbox")) throw new Error("Refusing to modify private environment files without explicit confirmation.");
if (!existsSync(productionPath)) throw new Error(".env.production.local was not found.");

const production = readFileSync(productionPath, "utf8");
const emailRaw = privateValue(production, "Email address");
const password = privateValue(production, "password");
const email = emailRaw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase() ?? "";

if (email !== "info@alanafc.gr") throw new Error("The private mailbox note does not contain the expected Alana FC sender address.");
if (!password || password.startsWith("[") || password.length < 8) throw new Error("The private mailbox password note is missing or has already been synchronized.");

for (const target of targets) {
  if (!existsSync(target)) throw new Error(`${target} was not found.`);
  let value = readFileSync(target, "utf8");
  value = replaceSetting(value, "SMTP_USER", email);
  value = replaceSetting(value, "SMTP_PASSWORD", password);
  value = replaceSetting(value, "MAIL_FROM", `Alana FC Academy <${email}>`);
  if (target === productionPath) value = value.replace(/^\s*#?\s*password\s*:\s*.+?\s*$/im, "# password: [synchronized into SMTP_PASSWORD]");
  writeFileSync(target, value, "utf8");
}

process.stdout.write(`${JSON.stringify({ ok: true, filesUpdated: targets.length, senderVerified: true, passwordPrinted: false, recipientsChanged: false }, null, 2)}\n`);
