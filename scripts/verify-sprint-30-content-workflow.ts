import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const archive = read("src/app/admin/content/page.tsx");
const editor = read("src/components/admin/content-editor.tsx");
const queries = read("src/features/content/queries.ts");
const styles = read("src/app/globals.css");

for (const field of ['name="q"', 'name="kind"', 'name="status"']) {
  if (!archive.includes(field)) throw new Error(`Content archive filter is missing ${field}.`);
}
if (!archive.includes("PAGE_SIZE = 30") || !archive.includes("adminContentCount")) throw new Error("Content archive pagination contract is incomplete.");
if (!archive.includes("articleTemplateCatalog[item.articleTemplate]")) throw new Error("Content archive does not expose the selected editorial template.");
if (!queries.includes("adminMediaLibrary") || !queries.includes('eq(mediaAssets.status, "ready")')) throw new Error("Admin media library does not restrict selection to ready assets.");
if (!editor.includes("article-media-picker__grid") || !editor.includes('aria-pressed={featured}') || !editor.includes('aria-pressed={gallerySelected}')) throw new Error("Visual featured/gallery media selection is incomplete.");
if (!editor.includes('type="hidden" name="featuredMediaExternalId"') || !editor.includes('type="hidden" name="galleryMediaExternalIds"')) throw new Error("Media selections are not submitted through the protected editor action.");
if (!styles.includes("Sprint 30: searchable archive and visual media selection")) throw new Error("Sprint 30 responsive design contract is missing.");

console.log("Sprint 30 searchable content archive and visual media workflow contract passed.");
