import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const contract = read("src/lib/deployment-database-contract.ts");
const tests = read("src/lib/deployment-database-contract.test.ts");
const preflight = read("scripts/deployment-preflight.ts");
const sprint = read("scripts/sprint-69.ps1");

for (const table of ["admin_users", "audit_events", "media_assets", "content_entries", "content_revisions", "legacy_redirects", "academy_registrations", "contact_messages"]) {
  if (!contract.includes(`"${table}"`)) throw new Error(`Deployment database contract omits ${table}.`);
}
if (!contract.includes('"__drizzle_migrations"') || !contract.includes("activeOwnerCount < 1")) throw new Error("Migration journal or active-owner readiness is not enforced.");
if (!tests.includes("accepts a migrated database with an active owner") || !tests.includes("reports missing schema and owner readiness")) throw new Error("Deployment database assessment lacks regression coverage.");
if (!preflight.includes("auditDeploymentEnvironment(process.env, mode)") || !preflight.includes("information_schema.TABLES") || !preflight.includes("SELECT COUNT(*) AS total")) throw new Error("The read-only deployment preflight is incomplete.");
if (/INSERT|UPDATE|DELETE|ALTER|DROP|CREATE TABLE/i.test(preflight)) throw new Error("Deployment preflight must remain read-only.");
if (!sprint.includes("run-flat-sprint-contracts.ps1") || !sprint.includes("sprint-07.ps1") || !sprint.includes("deployment:preflight")) throw new Error("Sprint 69 does not use the flat cumulative runner and final preflight.");

console.log("Sprint 69 read-only database deployment readiness contract passed.");
