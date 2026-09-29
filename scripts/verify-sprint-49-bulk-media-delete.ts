import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const actions = read("src/features/content/media-actions.ts");
const page = read("src/app/admin/media/page.tsx");
const form = read("src/components/admin/bulk-delete-media-form.tsx");
const styles = read("src/app/globals.css");

if (!actions.includes("bulkDeleteMediaAction") || !actions.includes('admin.role !== "owner"')) throw new Error("Bulk media deletion is not owner restricted.");
if (!actions.includes('formData.getAll("mediaIds")') || !actions.includes("parsedIds.length > 100")) throw new Error("Bulk media selection validation or its strict limit is missing.");
if (!actions.includes("permanentlyDeleteUnusedMedia") || !actions.includes("content.some") || !actions.includes("Ένα ή περισσότερα media χρησιμοποιούνται")) throw new Error("Bulk deletion does not reject referenced media as one operation.");
if (!actions.includes("pathsUsedByOtherAssets") || !actions.includes("notInArray(mediaAssets.id, ids)")) throw new Error("Shared physical files are not protected during bulk deletion.");
if (!page.includes('form="bulk-media-delete"') || !page.includes("disabled={item.usedBy.length > 0}") || !page.includes("<BulkDeleteMediaForm")) throw new Error("Safe bulk selection is not connected to the media cards.");
if (!form.includes("window.confirm") || !form.includes('getAll("mediaIds")') || !form.includes("bulkDeleteMediaAction")) throw new Error("Bulk deletion confirmation is incomplete.");
if (!styles.includes("Sprint 49: owner bulk media cleanup")) throw new Error("Responsive bulk cleanup styles are missing.");

console.log("Sprint 49 owner-only bulk media cleanup contract passed.");
