import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const queries = read("src/features/content/queries.ts");
const view = read("src/components/content/content-view.tsx");
const page = read("src/app/news/[slug]/page.tsx");
const styles = read("src/app/globals.css");

if (!queries.includes("publicPostContext") || !queries.includes("visibleNow()") || !queries.includes("categoryIds")) throw new Error("Related story lookup does not preserve category and publication boundaries.");
if (!view.includes("Προηγούμενο άρθρο") || !view.includes("Επόμενο άρθρο") || !view.includes("Σχετικά άρθρα")) throw new Error("Public article navigation is incomplete.");
if (!view.includes("content.authorName") || !view.includes("postContext.categories")) throw new Error("Visible author/category context is incomplete.");
if (!page.includes('"@type": "NewsArticle"') || !page.includes('"@type": "BreadcrumbList"') || !page.includes('inLanguage: "el-GR"')) throw new Error("Greek article structured data is incomplete.");
if (!page.includes("safeStructuredData(structuredData)")) throw new Error("Structured data is not serialized through the safe boundary.");
if (!styles.includes("Sprint 33: complete public article journey")) throw new Error("Responsive public article completion styles are missing.");

console.log("Sprint 33 public article navigation, related content, and structured-data contract passed.");
