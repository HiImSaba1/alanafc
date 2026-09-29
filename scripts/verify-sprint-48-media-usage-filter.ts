import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const page = read("src/app/admin/media/page.tsx");
const queries = read("src/features/content/queries.ts");
const styles = read("src/app/globals.css");

if (!page.includes('name="usage"') || !page.includes('value="unused"') || !page.includes('value="used"')) throw new Error("The media usage filter controls are missing.");
if (!page.includes("usageFilters.has(rawUsage)") || !page.includes("...(usage ? { usage } : {})")) throw new Error("Usage filter input is not allow-listed or connected to the catalogue query.");
if (!page.includes("pageHref(query, status, usage,")) throw new Error("Usage filtering is not preserved through pagination.");
if (!queries.includes('usage?: "used" | "unused"') || !queries.includes("usedExternalIds") || !queries.includes("notInArray(mediaAssets.externalId, usedExternalIds)") || !queries.includes("inArray(mediaAssets.externalId, usedExternalIds)")) throw new Error("Database-backed used and unused media filtering is incomplete.");
if (!queries.includes("sql`1 = 0`")) throw new Error("The empty used-media result is not handled safely.");
if (!styles.includes("Sprint 48: usage-aware media catalogue")) throw new Error("The responsive Sprint 48 style contract is missing.");

console.log("Sprint 48 usage-aware media catalogue contract passed.");
