import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const message = read("src/lib/mail/smoke-message.ts");
const tests = read("src/lib/mail/smoke-message.test.ts");
const command = read("scripts/send-smtp-smoke-test.ts");
const sprint = read("scripts/sprint-72.ps1");
const packageJson = read("package.json");

if (!message.includes("[ΔΟΚΙΜΗ]") || !message.includes("δεν περιέχει δεδομένα φόρμας")) throw new Error("The smoke-test message is not clearly identified or data-free.");
if (!tests.includes("contains no form data") || !tests.includes("Δεν απαιτείται απάντηση")) throw new Error("Smoke-test content lacks regression coverage.");
if (!command.includes('--confirm-send-smoke-test') || !command.includes("Refusing to send")) throw new Error("SMTP smoke delivery lacks explicit confirmation.");
if (!command.includes("configuration.recipients[0]") || !command.includes("messagesSent: 1") || !command.includes('"X-Auto-Response-Suppress": "All"')) throw new Error("Single-recipient smoke delivery boundaries are incomplete.");
if (!command.includes("No credential, recipient, provider response, or message identifier was printed")) throw new Error("Smoke-test failure output is not secret-safe.");
if (!command.includes('command.startsWith("MAIL")') || !command.includes('command.startsWith("RCPT")') || command.includes("error.message")) throw new Error("Smoke-test failures are not classified safely by SMTP stage.");
if (!packageJson.includes('"smtp:send-smoke:confirmed": "tsx scripts/send-smtp-smoke-test.ts --confirm-send-smoke-test"')) throw new Error("The warning-free confirmed smoke-test command is missing.");
if (!sprint.includes("run-flat-sprint-contracts.ps1") || sprint.includes("& npm run smtp:send-smoke")) throw new Error("Sprint 72 must keep external smoke delivery optional.");

console.log("Sprint 72 confirmed, single-recipient SMTP smoke-test contract passed.");
