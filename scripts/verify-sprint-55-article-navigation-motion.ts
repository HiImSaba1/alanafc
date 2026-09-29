import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const queries = read("src/features/content/queries.ts");
const view = read("src/components/content/content-view.tsx");
const transition = read("src/components/motion/page-transition.tsx");
const richContent = read("src/components/content/rich-content.tsx");

if (!queries.includes("newerThanCurrent") || !queries.includes("olderThanCurrent") || !queries.includes("contentEntries.id} > ${content.id}") || !queries.includes("contentEntries.id} < ${content.id}")) throw new Error("Post neighbors are not deterministic when publication timestamps match.");
if ((queries.match(/ne\(contentEntries\.id, content\.id\)/g)?.length ?? 0) < 3) throw new Error("The current article is not explicitly excluded from neighbor and related queries.");
if (!view.includes('rel="prev"') || !view.includes('rel="next"') || !view.includes("Προηγούμενο άρθρο") || !view.includes("Επόμενο άρθρο")) throw new Error("Semantic previous and next article links are incomplete.");
if (!view.includes("postContext.older.slug") || !view.includes("postContext.newer.slug")) throw new Error("Previous and next links point in the wrong chronological direction.");
if (!transition.includes('addEventListener("click", onClick, true)') || !transition.includes('removeEventListener("click", onClick, true)')) throw new Error("Page transitions do not intercept internal navigation before Next.js.");
if (!richContent.includes("SplitText.create") || !richContent.includes('p, h2, h3, h4, li, blockquote, figcaption') || !richContent.includes("ScrollTrigger.create") || !richContent.includes("prefers-reduced-motion: reduce")) throw new Error("Reduced-motion-safe rich-text line entrances are incomplete.");
if (!richContent.includes("split.revert()") || !richContent.includes("revertOnUpdate: true")) throw new Error("Rich-text animation cleanup is incomplete across article navigation.");

console.log("Sprint 55 deterministic article navigation and entrance motion passed.");
