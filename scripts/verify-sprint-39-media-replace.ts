import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const actions = read("src/features/content/media-actions.ts");
const page = read("src/app/admin/media/[id]/page.tsx");
const styles = read("src/app/globals.css");

if (!actions.includes("validatedImage") || !actions.includes("MAX_UPLOAD_BYTES") || !actions.includes("MAX_IMAGE_PIXELS")) throw new Error("Replacement does not share strict image validation.");
if (!actions.includes("createWebpDerivatives") || !actions.includes("webp({ quality: 84")) throw new Error("SEO WebP regeneration is incomplete.");
if (!actions.includes("replaceMediaFileAction") || !actions.includes('admin.role !== "owner"')) throw new Error("Media replacement is not owner restricted.");
if (!actions.includes('startsWith("native-media-")') || !actions.includes("Τα legacy media προστατεύονται από αντικατάσταση")) throw new Error("Legacy media replacement protection is missing.");
if (!actions.includes('audit("media.file_replaced"') || !actions.includes("previousPaths.map")) throw new Error("Replacement audit or post-success cleanup is incomplete.");
if (!actions.includes('redirect(`/admin/media/${asset.id}?replaced=1`)')) throw new Error("Successful replacement does not return confirmation to the detail route.");
if (!page.includes("replaceMediaFileAction") || !page.includes('name="image"') || !page.includes("Το media ID και όλες οι συνδέσεις")) throw new Error("The replacement workflow is missing from the detail page.");
if (!page.includes('admin.role === "owner"') || !page.includes('startsWith("native-media-")')) throw new Error("Replacement form visibility is not restricted to owner-managed native media.");
if (!styles.includes("Sprint 39: safe native-media replacement")) throw new Error("Responsive replacement styling is missing.");

console.log("Sprint 39 safe native-media replacement contract passed.");
