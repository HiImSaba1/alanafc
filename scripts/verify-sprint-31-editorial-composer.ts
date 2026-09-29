import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const composer = read("src/components/admin/editorial-html-composer.tsx");
const editor = read("src/components/admin/content-editor.tsx");
const core = read("src/features/content/core.ts");
const styles = read("src/app/globals.css");
const actions = read("src/features/content/admin-actions.ts");
const deleteButton = read("src/components/admin/delete-content-button.tsx");

for (const control of ["Παράγραφος", "Υπότιτλος", "Έντονη γραφή", "Πλάγια γραφή", "Παράθεμα", "Λίστα", "Σύνδεσμος"]) {
  if (!composer.includes(`title: \"${control}\"`)) throw new Error(`Editorial control is missing: ${control}.`);
}
if (!composer.includes("sanitizeEditorHtml(value)")) throw new Error("Live preview is not sanitized.");
if (!composer.includes('name="bodyHtml"') || !composer.includes("Περίπου {minutes} λεπτά ανάγνωσης")) throw new Error("Composer submission or reading feedback is incomplete.");
if (!core.includes("suggestGreeklishSlug") || !editor.includes("suggestGreeklishSlug(nextTitle)")) throw new Error("Assisted Greeklish slug generation is incomplete.");
if (!editor.includes("slugTouched")) throw new Error("Manual slug changes are not protected from automatic overwrites.");
if (!styles.includes("Sprint 31: assisted editorial HTML composer")) throw new Error("Responsive composer styling is missing.");
if (!actions.includes("deleteContentAction") || !actions.includes("db.delete(contentEntries)") || !actions.includes('admin.role !== "owner"')) throw new Error("Owner-only permanent content deletion is incomplete.");
if (!deleteButton.includes("window.confirm") || !deleteButton.includes("Η ενέργεια δεν αναιρείται")) throw new Error("Permanent deletion does not require explicit confirmation.");

console.log("Sprint 31 assisted editorial composer contract passed.");
