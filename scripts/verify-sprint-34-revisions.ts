import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const schema = read("src/lib/db/schema.ts");
const actions = read("src/features/content/admin-actions.ts");
const history = read("src/components/admin/content-revision-history.tsx");
const page = read("src/app/admin/content/[id]/page.tsx");

if (!schema.includes('mysqlTable("content_revisions"') || !schema.includes('onDelete: "cascade"') || !schema.includes("content_revisions_entry_number_unique")) throw new Error("Revision persistence schema is incomplete.");
if (!actions.includes("Πριν από ενημέρωση") || !actions.includes("transaction.insert(contentRevisions)")) throw new Error("Existing content is not checkpointed before save.");
if (!actions.includes("restoreContentRevisionAction") || !actions.includes("Checkpoint πριν από επαναφορά") || !actions.includes('admin.role !== "owner"')) throw new Error("Owner-only recoverable revision restoration is incomplete.");
if (!history.includes("window.confirm") || !history.includes("Η τρέχουσα έκδοση θα κρατηθεί ως checkpoint")) throw new Error("Revision restore confirmation is missing.");
if (!page.includes("adminContentRevisions") || !page.includes("ContentRevisionHistory")) throw new Error("Revision history is not connected to the edit page.");

console.log("Sprint 34 recoverable database revision history contract passed.");
