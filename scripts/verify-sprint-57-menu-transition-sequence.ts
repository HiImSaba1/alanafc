import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const header = read("src/components/layout/site-header.tsx");
const transition = read("src/components/motion/page-transition.tsx");

if (!header.includes("navigateFromOpenMenu") || !header.includes("data-menu-navigation")) throw new Error("Menu links are not routed through the menu-aware navigation contract.");
if (!header.includes("alana:view-transition-captured") || !header.includes("closeAfterCapture")) throw new Error("The menu does not remain open until the outgoing snapshot is captured.");
if (!header.includes('new CustomEvent("alana:menu-navigation-ready"') || !transition.includes('addEventListener("alana:menu-navigation-ready"')) throw new Error("The menu does not hand navigation to the global page transition.");
if (!transition.includes("anchor.dataset.menuNavigation !== undefined")) throw new Error("The global click interceptor can race menu-managed navigation.");
if (!transition.includes("startViewTransition") || !transition.includes("router.push")) throw new Error("The coordinated navigation does not complete through the Next.js router.");
if (!header.includes('prefers-reduced-motion: reduce') || !transition.includes('prefers-reduced-motion: reduce')) throw new Error("The coordinated sequence does not preserve reduced-motion behavior.");

console.log("Sprint 57 menu-close then page-transition sequence passed.");
