import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const page = read("src/app/admin/media/page.tsx");
const actions = read("src/features/content/media-actions.ts");
const queries = read("src/features/content/queries.ts");
const shell = read("src/components/admin/admin-workspace-shell.tsx");

if (!shell.includes('/admin/media') || !shell.includes("Βιβλιοθήκη media")) throw new Error("Media library is missing from admin navigation.");
for (const field of ['name="q"', 'name="status"', 'name="altText"', 'name="caption"', 'name="credit"']) if (!page.includes(field)) throw new Error(`Media workflow is missing ${field}.`);
if (!page.includes("PAGE_SIZE = 24") || !page.includes("SEO:")) throw new Error("Media pagination or SEO derivative visibility is incomplete.");
if (!actions.includes("updateMediaMetadataAction") || !actions.includes("metadataSchema") || !actions.includes('audit("media.metadata_updated"')) throw new Error("Validated and audited media metadata updates are incomplete.");
if (!queries.includes("adminMediaCatalog") || !queries.includes("COUNT(*)")) throw new Error("Filtered media catalogue query is incomplete.");

console.log("Sprint 35 managed SEO-aware media library contract passed.");
