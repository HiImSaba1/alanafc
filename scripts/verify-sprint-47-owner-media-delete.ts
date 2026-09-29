import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const actions = read("src/features/content/media-actions.ts");
const catalogue = read("src/app/admin/media/page.tsx");
const detail = read("src/app/admin/media/[id]/page.tsx");

if (!actions.includes('admin.role !== "owner"')) throw new Error("Permanent deletion is not restricted to the owner.");
if (actions.includes('if (!asset.externalId.startsWith("native-media-")) throw new Error("Τα legacy media προστατεύονται από οριστική διαγραφή.')) throw new Error("Imported media is still blocked from owner deletion.");
if (!catalogue.includes('admin.role === "owner" ? <DeleteMediaButton') || !detail.includes('admin.role === "owner" ? <DeleteMediaButton')) throw new Error("The owner delete control is unavailable for imported media.");
if (!actions.includes('resolve(publicRoot, "uploads", "media")') || !actions.includes('resolve(publicRoot, "media")') || !actions.includes('resolve(publicRoot, "alana_fc_academy_images_wordpress")')) throw new Error("The approved deletion roots are incomplete.");
if (!actions.includes("relative(root, candidate)") || !actions.includes("isAbsolute(child)")) throw new Error("Deletion paths are not confined to approved roots.");
if (!actions.includes("pathsUsedByOtherAssets") || !actions.includes("otherAssets.flatMap(deletableMediaPaths)")) throw new Error("Shared physical files are not protected.");
if (!actions.includes("media χρησιμοποιούνται σε περιεχόμενο και δεν μπορούν να διαγραφούν.")) throw new Error("Content references do not block deletion.");

console.log("Sprint 47 owner deletion for native and imported media passed.");
