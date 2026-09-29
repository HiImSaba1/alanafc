import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const layout = read("src/app/admin/layout.tsx");
const shell = read("src/components/admin/admin-workspace-shell.tsx");
const query = read("src/features/admin-auth/audit-query.ts");
const page = read("src/app/admin/activity/page.tsx");
const styles = read("src/app/globals.css");

if (!layout.includes("currentAdmin") || !layout.includes("role={admin?.role ?? null}")) throw new Error("Admin role is not passed safely into the workspace shell.");
if (!shell.includes('/admin/activity') || !shell.includes("ownerOnly") || !shell.includes('role === "owner"')) throw new Error("The owner-only audit navigation is incomplete.");
if (!query.includes("adminAuditLog") || !query.includes("leftJoin(adminUsers") || !query.includes("COUNT(*)")) throw new Error("Paginated actor-aware audit querying is incomplete.");
if (!page.includes("await requireAdmin()") || !page.includes('admin.role !== "owner"') || !page.includes('redirect("/admin")')) throw new Error("Audit route owner authorization is incomplete.");
for (const field of ['name="q"', 'name="type"', "PAGE_SIZE = 40", "requestId.slice(0, 8)"]) if (!page.includes(field)) throw new Error(`Audit interface is missing ${field}.`);
if (!page.includes("actionLabels") || !page.includes("admin-content-pagination")) throw new Error("Readable audit labels or pagination are missing.");
if (!styles.includes("Sprint 40: owner-only audit trail")) throw new Error("Responsive audit-trail styling is missing.");

console.log("Sprint 40 owner-only searchable audit trail contract passed.");
