import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const queries = read("src/features/content/queries.ts");
const page = read("src/app/admin/media/page.tsx");
const styles = read("src/app/globals.css");

if (!queries.includes("adminMediaHealthSummary") || !queries.includes("knownExternalIds") || !queries.includes("usedExternalIds")) throw new Error("The global media-health aggregation is incomplete.");
if (!queries.includes("missingAlt:") || !queries.includes("unavailable:") || !queries.includes("asset.status === \"missing\"")) throw new Error("SEO and unavailable-file health counts are missing.");
if (!page.includes("adminMediaHealthSummary()") || !page.includes('aria-label="Σύνοψη κατάστασης media"')) throw new Error("The media-health overview is not rendered in the authenticated library.");
for (const href of ["/admin/media?usage=used", "/admin/media?usage=unused", "/admin/media?seo=missing", "/admin/media?status=missing"]) if (!page.includes(href)) throw new Error(`The health shortcut ${href} is missing.`);
if (!page.includes("health.total") || !page.includes("health.used") || !page.includes("health.unused") || !page.includes("health.missingAlt") || !page.includes("health.unavailable")) throw new Error("One or more health metrics are not visible.");
if (!styles.includes("Sprint 52: media health overview") || !styles.includes("admin-media__health")) throw new Error("Responsive media-health styling is missing.");

console.log("Sprint 52 linked media-health overview passed.");
