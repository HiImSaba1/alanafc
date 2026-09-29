import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const page = read("src/app/admin/media/[id]/page.tsx");
const catalog = read("src/app/admin/media/page.tsx");
const queries = read("src/features/content/queries.ts");
const actions = read("src/features/content/media-actions.ts");
const styles = read("src/app/globals.css");

if (!catalog.includes('/admin/media/${item.id}') || !catalog.includes("Επεξεργασία media") || !catalog.includes("<Pencil")) throw new Error("The media catalogue does not provide an accessible edit link to the detail workspace.");
if (!page.includes("await requireAdmin()") || !page.includes("adminMediaById") || !page.includes("notFound()")) throw new Error("The media detail route is not authenticated or missing-safe.");
for (const field of ['name="altText"', 'name="caption"', 'name="credit"']) if (!page.includes(field)) throw new Error(`Media detail metadata is missing ${field}.`);
if (!page.includes("derivativeManifest") || !page.includes("download") || !page.includes("WebP μεγέθη")) throw new Error("Derivative inventory and download access are incomplete.");
if (!page.includes("item.usedBy.map") || !page.includes('/admin/content/${entry.id}')) throw new Error("Complete media usage navigation is missing.");
if (!page.includes("DeleteMediaButton") || !page.includes('admin.role === "owner"')) throw new Error("Owner-only deletion is not connected to the detail workspace.");
if (!queries.includes("adminMediaById") || !queries.includes("galleryMediaExternalIds.includes(item.externalId)")) throw new Error("Single-media usage discovery is incomplete.");
if (!actions.includes('revalidatePath(`/admin/media/${parsed.data.id}`)')) throw new Error("Metadata updates do not refresh the detail route.");
if (!actions.includes('redirect("/admin/media")')) throw new Error("Successful deletion does not return to the media catalogue.");
if (!styles.includes("Sprint 38: dedicated media detail workspace")) throw new Error("Responsive detail workspace styling is missing.");

console.log("Sprint 38 authenticated media detail workspace contract passed.");
