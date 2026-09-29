import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const header = read("src/components/layout/site-header.tsx");
const transition = read("src/components/motion/page-transition.tsx");
const styles = read("src/app/globals.css");

if (!header.includes("navigateFromOpenMenu") || header.includes("closeMenuThenNavigate")) throw new Error("Menu-link navigation still closes the menu before transition capture.");
if (!header.includes('window.dispatchEvent(new CustomEvent("alana:menu-navigation-ready"') || !header.includes("data-menu-navigation")) throw new Error("Menu links do not trigger the shared incoming-page reveal.");
if (!transition.includes("transitionDocument.startViewTransition(async () => {") || !transition.includes('window.dispatchEvent(new Event("alana:view-transition-captured"))')) throw new Error("The menu close is not delayed until after the old-page snapshot.");
if (!header.includes('window.addEventListener("alana:view-transition-captured", closeAfterCapture)')) throw new Error("The live menu does not close after capture.");
if (!styles.includes("::view-transition-new(root)") || !styles.includes("clip-path: inset(35% 35% round 1.25rem)")) throw new Error("The incoming page does not reveal above the captured open menu.");

console.log("Sprint 62 incoming-page reveal above the open menu passed.");
