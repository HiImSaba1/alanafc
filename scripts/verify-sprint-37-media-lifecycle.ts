import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const actions = read("src/features/content/media-actions.ts");
const queries = read("src/features/content/queries.ts");
const page = read("src/app/admin/media/page.tsx");
const button = read("src/components/admin/delete-media-button.tsx");

if (!queries.includes("usedBy") || !queries.includes("galleryMediaExternalIds") || !queries.includes("featuredMediaExternalId")) throw new Error("Media usage discovery is incomplete.");
if (!page.includes("Χρησιμοποιείται σε") || !page.includes("Δεν χρησιμοποιείται") || !page.includes('/admin/content/${entry.id}')) throw new Error("Media references are not visible in the library.");
if (!actions.includes("deleteMediaAction") || !actions.includes('admin.role !== "owner"')) throw new Error("Permanent media deletion is not owner restricted.");
if (!page.includes('admin.role === "owner" ? <DeleteMediaButton') || page.includes('item.externalId.startsWith("native-media-") ? <DeleteMediaButton')) throw new Error("Owners cannot delete imported media from the catalogue.");
if (!actions.includes("media χρησιμοποιούνται σε περιεχόμενο") || !actions.includes("content.some")) throw new Error("Referenced-media deletion is not blocked server-side.");
if (!actions.includes("deletableMediaRoots") || !actions.includes("isAbsolute(child)") || !actions.includes("pathsUsedByOtherAssets") || !actions.includes("unlink(path)")) throw new Error("Physical media deletion is not safely confined or shared-file aware.");
if (!button.includes("window.confirm") || !button.includes("όλων των τοπικών αρχείων")) throw new Error("Permanent media deletion confirmation is incomplete.");

console.log("Sprint 37 reference-aware owner media lifecycle contract passed.");
