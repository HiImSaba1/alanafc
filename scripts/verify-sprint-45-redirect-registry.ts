import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const shell = read("src/components/admin/admin-workspace-shell.tsx");
const page = read("src/app/admin/redirects/page.tsx");
const styles = read("src/app/globals.css");

if (!shell.includes('/admin/redirects') || !shell.includes('label: "Ανακατευθύνσεις", ownerOnly: true')) throw new Error("Owner-only redirect navigation is missing.");
if (!page.includes("await requireAdmin()") || !page.includes('admin.role !== "owner"') || !page.includes('redirect("/admin")')) throw new Error("Redirect registry owner authorization is incomplete.");
if (!page.includes("PAGE_SIZE = 40") || !page.includes("COUNT(*)") || !page.includes(".limit(PAGE_SIZE).offset")) throw new Error("Redirect registry pagination is incomplete.");
if (!page.includes('name="q"') || !page.includes("legacyRedirects.sourcePath") || !page.includes("legacyRedirects.targetPath") || !page.includes("legacyRedirects.sourceExternalId")) throw new Error("Redirect search coverage is incomplete.");
if (!page.includes("item.statusCode") || !page.includes("item.createdAt") || !page.includes('target="_blank"') || !page.includes("ExternalLink")) throw new Error("Read-only redirect inspection is incomplete.");
if (!page.includes("admin-content-pagination") || !page.includes("pageHref(query")) throw new Error("Filter-preserving redirect pagination is missing.");
if (!styles.includes("Sprint 45: read-only redirect registry")) throw new Error("Responsive redirect registry styling is missing.");

console.log("Sprint 45 owner-only read-only redirect registry contract passed.");
