import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const csv = read("src/lib/csv.ts");
const registrations = read("src/app/api/admin/exports/registrations/route.ts");
const messages = read("src/app/api/admin/exports/messages/route.ts");
const registrationsPage = read("src/app/admin/registrations/page.tsx");
const messagesPage = read("src/app/admin/messages/page.tsx");
const activity = read("src/app/admin/activity/page.tsx");

if (!csv.includes("FORMULA_PREFIX") || !csv.includes("replaceAll") || !csv.includes("\\uFEFF") || !csv.includes('join("\\r\\n")')) throw new Error("Secure Excel-compatible CSV serialization is incomplete.");
for (const [name, route] of [["registrations", registrations], ["messages", messages]] as const) {
  if (!route.includes("await requireAdmin()") || !route.includes('admin.role !== "owner"') || !route.includes("status: 403")) throw new Error(`${name} export is not owner restricted.`);
  if (!route.includes("EXPORT_LIMIT = 10_000") || !route.includes('"Cache-Control": "private, no-store"') || !route.includes('"Content-Disposition"')) throw new Error(`${name} export response boundaries are incomplete.`);
}
if (!registrations.includes('audit("registration.exported"') || !messages.includes('audit("contact.exported"')) throw new Error("Sensitive exports are not audited.");
if (!registrationsPage.includes('/api/admin/exports/registrations') || !messagesPage.includes('/api/admin/exports/messages') || !registrationsPage.includes('admin.role === "owner"') || !messagesPage.includes('admin.role === "owner"')) throw new Error("Owner export controls are not connected to both admin lists.");
if (!activity.includes('"registration.exported"') || !activity.includes('"contact.exported"')) throw new Error("Export audit events do not have readable labels.");

console.log("Sprint 41 owner-only formula-safe CSV export contract passed.");
