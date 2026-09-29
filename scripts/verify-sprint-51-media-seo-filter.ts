import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const page = read("src/app/admin/media/page.tsx");
const queries = read("src/features/content/queries.ts");
const styles = read("src/app/globals.css");

if (!page.includes('name="seo"') || !page.includes('value="missing"') || !page.includes('value="complete"') || !page.includes("Χωρίς alt text")) throw new Error("The SEO completeness controls are missing.");
if (!page.includes("seoFilters.has(rawSeo)") || !page.includes("...(seo ? { seo } : {})")) throw new Error("SEO filter input is not allow-listed or connected to the catalogue query.");
if (!page.includes("pageHref(query, status, usage, seo,")) throw new Error("SEO filtering is not preserved through pagination.");
if (!queries.includes('seo?: "complete" | "missing"') || !queries.includes('filters.seo === "missing"') || !queries.includes('filters.seo === "complete"')) throw new Error("The database SEO filter contract is incomplete.");
if (!queries.includes("isNull(mediaAssets.altText)") || !queries.includes("isNotNull(mediaAssets.altText)") || !queries.includes('eq(mediaAssets.altText, "")')) throw new Error("Empty and null alt text are not classified safely.");
if (!styles.includes("Sprint 51: media SEO completeness filter")) throw new Error("The Sprint 51 responsive style contract is missing.");

console.log("Sprint 51 media SEO completeness filtering passed.");
