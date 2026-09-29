import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const queries = read("src/features/content/queries.ts");
const library = read("src/app/admin/media/page.tsx");
const page = read("src/app/admin/media/duplicates/page.tsx");
const styles = read("src/app/globals.css");

if (!queries.includes("adminDuplicateMediaGroups") || !queries.includes("isNotNull(mediaAssets.sha256)") || !queries.includes("items.length > 1")) throw new Error("Checksum-based duplicate grouping is incomplete.");
if (!queries.includes("duplicateGroups:") || !library.includes("health.duplicateGroups") || !library.includes('/admin/media/duplicates')) throw new Error("The duplicate health metric is not connected to the library.");
if (!page.includes("await requireAdmin()") || !page.includes("adminDuplicateMediaGroups()")) throw new Error("The duplicate audit is not authenticated or data-backed.");
if (!page.includes("Τα αρχεία εμφανίζονται μόνο για έλεγχο") || !page.includes('/admin/media/${item.id}') || !page.includes("Έλεγχος χρήσης")) throw new Error("The duplicate audit does not guide safe usage review.");
if (page.includes("deleteMediaAction") || page.includes("bulkDeleteMediaAction")) throw new Error("The duplicate audit must not automatically expose destructive actions.");
if (!styles.includes("Sprint 53: duplicate media audit") || !styles.includes("admin-media-duplicates__group")) throw new Error("Responsive duplicate-audit styles are missing.");

console.log("Sprint 53 authenticated duplicate-media audit passed.");
