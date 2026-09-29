import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const configuration = read("src/lib/mail/configuration.ts");
const tests = read("src/lib/mail/configuration.test.ts");
const transport = read("src/lib/mail/transport.ts");
const contact = read("src/features/contact/mail.ts");
const registrations = read("src/features/registrations/mail.ts");
const preflight = read("scripts/verify-smtp-connection.ts");
const sprint = read("scripts/sprint-71.ps1");

if (!configuration.includes("academyMailConfiguration") || !configuration.includes("SMTP_SECURE") || !configuration.includes("recipients")) throw new Error("Shared academy SMTP configuration is incomplete.");
if (!configuration.includes("from.toLowerCase().includes(user.toLowerCase())") || !tests.includes("rejects invalid ports, TLS values, and sender mismatch")) throw new Error("SMTP sender and transport validation lacks coverage.");
if (!transport.includes("connectionTimeout: 10_000") || !transport.includes("socketTimeout: 15_000")) throw new Error("Runtime SMTP transport timeouts are incomplete.");
if (!contact.includes("createAcademyMailTransport()") || !registrations.includes("createAcademyMailTransport()")) throw new Error("Contact and registration delivery do not share the SMTP contract.");
if (!preflight.includes("await transporter.verify()") || !preflight.includes("messagesSent: 0") || preflight.includes("sendMail(")) throw new Error("SMTP connection verification must authenticate without sending mail.");
if (!preflight.includes("No credential values were printed")) throw new Error("SMTP failure output is not explicitly secret-safe.");
if (!preflight.includes('code === "EAUTH"') || !preflight.includes('"tls-certificate"') || preflight.includes("error.message")) throw new Error("SMTP failures are not classified without exposing provider details.");
if (!sprint.includes("run-flat-sprint-contracts.ps1") || sprint.includes("& npm run smtp:verify-connection")) throw new Error("Sprint 71 must remain deterministic and keep the network SMTP check optional.");

console.log("Sprint 71 shared and secret-safe mail delivery readiness passed.");
