import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const queries = read("src/features/content/queries.ts");
const page = read("src/app/admin/media/duplicates/page.tsx");
const styles = read("src/app/globals.css");

if (!queries.includes("const usage = new Map") || !queries.includes("featured: contentEntries.featuredMediaExternalId") || !queries.includes("gallery: contentEntries.galleryMediaExternalIds")) throw new Error("Duplicate usage discovery is incomplete.");
if (!queries.includes("usedBy: usage.get(item.externalId) || []")) throw new Error("Usage references are not attached to duplicate records.");
if (!page.includes("item.usedBy.length") || !page.includes("Υποψήφιο για καθαρισμό") || !page.includes("Σε χρήση")) throw new Error("Duplicate usage status is not visible.");
if (!page.includes("item.usedBy.slice(0, 3)") || !page.includes('/admin/content/${entry.id}')) throw new Error("Referenced content is not linked from duplicate cards.");
if (!page.includes("Έλεγχος πριν τη διαγραφή") || !page.includes("Δεν συνδέεται με άρθρο ή σελίδα")) throw new Error("Unused duplicate guidance is incomplete.");
if (!styles.includes("Sprint 54: duplicate usage intelligence") || !styles.includes("admin-media-duplicates__usage")) throw new Error("Duplicate usage styling is missing.");

console.log("Sprint 54 duplicate-media usage intelligence passed.");
