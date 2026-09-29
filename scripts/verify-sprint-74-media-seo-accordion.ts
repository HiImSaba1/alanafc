import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const page = read("src/app/admin/media/page.tsx");
const styles = read("src/app/globals.css");
const sprint = read("scripts/sprint-74.ps1");

if (!page.includes("admin-media__seo") || !page.includes("FileSearch2") || !page.includes("ChevronDown")) throw new Error("Media cards do not expose the SEO icon accordion.");
if (!page.includes("suggestedImageMetadata") || !page.includes("item.altText?.trim() ||") || !page.includes("item.caption?.trim() ||") || !page.includes("item.credit?.trim() ||")) throw new Error("Missing SEO fields are not safely suggested while preserving owner values.");
if (!page.includes("item.usedBy[0]?.title") || !page.includes("readableImageName")) throw new Error("SEO suggestions lack usage context and filename fallback.");
if (!page.includes('defaultValue={metadata.altText}') || !page.includes('defaultValue={metadata.caption}') || !page.includes('defaultValue={metadata.credit}')) throw new Error("SEO suggestions do not prefill all editable fields.");
if (!page.includes("Ελέγξτε την περιγραφή πριν την αποθήκευση")) throw new Error("The generated metadata lacks an editorial review notice.");
if (!styles.includes(".admin-media__seo[open]") || !styles.includes("rotate(180deg)")) throw new Error("The SEO accordion lacks an open-state treatment.");
if (!sprint.includes("run-flat-sprint-contracts.ps1") || sprint.includes("db:migrate")) throw new Error("Sprint 74 must remain deterministic and database-read-free.");

console.log("Sprint 74 media SEO accordion and suggestion contract passed.");
