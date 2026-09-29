import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const audit = read("src/lib/deployment-environment.ts");
const tests = read("src/lib/deployment-environment.test.ts");
const command = read("scripts/check-deployment-environment.ts");
const example = read(".env.example");
const sprint = read("scripts/sprint-68.ps1");
const flatRunner = read("scripts/run-flat-sprint-contracts.ps1");

if (!audit.includes('mode: DeploymentMode') || !audit.includes('parsed.username.toLowerCase() === "root"') || !audit.includes('database !== expectedDatabaseName') || !audit.includes('configuredDatabaseName')) throw new Error("Production database environment boundaries are incomplete.");
if (!audit.includes("SESSION_SECRET") || !audit.includes("ADMIN_PASSWORD") || !audit.includes("SMTP_PASSWORD") || !audit.includes("NEXT_PUBLIC_SITE_URL")) throw new Error("Required deployment environment groups are incomplete.");
if (!audit.includes("requiredRecipients") || !audit.includes("MAIL_FROM must use the authenticated SMTP_USER address")) throw new Error("Academy mail routing boundaries are incomplete.");
if (!command.includes('process.loadEnvFile(".env.local")') || !command.includes('process.argv.includes("--production")')) throw new Error("The read-only local and production audit command is incomplete.");
if (!tests.includes("without exposing their values") || !tests.includes("not.toContain(secret)")) throw new Error("Secret-safe reporting lacks regression coverage.");
if (!example.includes("NEXT_PUBLIC_SITE_URL=https://alanafc.gr") || !example.includes("SMTP_USER=info@alanafc.gr") || example.includes("SMTP_PASSWORD=\n")) throw new Error("The environment template is incomplete or stale.");
if (!sprint.includes("run-flat-sprint-contracts.ps1") || sprint.includes("sprint-67.ps1")) throw new Error("Sprint 68 still uses the recursive PowerShell verification chain.");
if (!flatRunner.includes("for ($sprint = $FromSprint; $sprint -ge $ToSprint; $sprint--)") || !flatRunner.includes("Sprint $sprint contract '$command' failed")) throw new Error("The flat sprint contract runner is incomplete.");

console.log("Sprint 68 secret-safe deployment environment contract passed.");
