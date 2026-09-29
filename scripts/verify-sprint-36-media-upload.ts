import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const actions = read("src/features/content/media-actions.ts");
const page = read("src/app/admin/media/page.tsx");

if (!actions.includes("uploadMediaAction") || !actions.includes("await requireAdmin()")) throw new Error("Media upload is not protected by admin authentication.");
if (!actions.includes("MAX_UPLOAD_BYTES") || !actions.includes("MAX_IMAGE_PIXELS") || !actions.includes('failOn: "error"')) throw new Error("Upload size, pixel, or decoder validation is incomplete.");
if (!actions.includes("createWebpDerivatives(input, width, parsed.data.altText)") || !actions.includes("alanafc_${seoSlug(altText)}_img_${imageNumber}") || !actions.includes("${base}_${derivativeWidth}w.webp")) throw new Error("SEO WebP naming contract is incomplete.");
if (!actions.includes("withoutEnlargement: true") || !actions.includes("derivativeManifest")) throw new Error("Responsive derivative generation is incomplete.");
if (!actions.includes("Promise.all(createdFiles") || !actions.includes('writeFile(absolutePath, output, { flag: "wx" })')) throw new Error("Collision protection or file rollback is incomplete.");
if (!actions.includes('audit("media.uploaded"')) throw new Error("Successful uploads are not audited.");
if (!page.includes('type="file"') || !page.includes("Μεταφόρτωση και βελτιστοποίηση")) throw new Error("Admin upload interface is incomplete.");

console.log("Sprint 36 authenticated optimized media upload contract passed.");
