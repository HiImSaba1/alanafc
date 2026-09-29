import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const form = read("src/components/admin/bulk-delete-media-form.tsx");
const page = read("src/app/admin/media/page.tsx");
const styles = read("src/app/globals.css");

if (!form.includes("useState(0)") || !form.includes("updateSelectedCount") || !form.includes('aria-live="polite"')) throw new Error("The live bulk-selection count is incomplete.");
if (!form.includes("Επιλογή όλων") || !form.includes("Καθαρισμός") || !form.includes("setAll(true)") || !form.includes("setAll(false)")) throw new Error("Select-all and clear controls are missing.");
if (!form.includes('input[name="mediaIds"][form="bulk-media-delete"]:not(:disabled)')) throw new Error("Bulk selection is not restricted to eligible media checkboxes.");
if (!form.includes('type="submit" disabled={selectedCount === 0}')) throw new Error("The destructive action is enabled without a selection.");
if (!page.includes("disabled={item.usedBy.length > 0}")) throw new Error("Referenced media can be included in bulk selection.");
if (!styles.includes("Sprint 50: bulk media selection controls") || !styles.includes("admin-media__bulk-controls")) throw new Error("Responsive Sprint 50 styles are missing.");

console.log("Sprint 50 accessible bulk media selection controls passed.");
