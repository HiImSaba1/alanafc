import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const transition = read("src/components/motion/page-transition.tsx");
const styles = read("src/app/globals.css");

if (!transition.includes("startViewTransition") || !transition.includes("transition.finished.then(finish, finish)")) throw new Error("The actual incoming page is not coordinated through the View Transition API.");
if (!transition.includes("router.push(target)") || !transition.includes("routeReady.current = resolve") || !transition.includes("window.location.href !== pendingTargetHref.current")) throw new Error("The next-page snapshot is not held until Next.js renders the exact destination.");
if (transition.includes("data-transition-logo") || transition.includes("className=\"page-transition\"") || transition.includes("return <div")) throw new Error("The old overlay transition has not been removed.");
if (!styles.includes("::view-transition-new(root)") || !styles.includes("alana-next-page-reveal")) throw new Error("The incoming-page snapshot animation is missing.");
if (!styles.includes("clip-path: inset(35% 35% round 1.25rem)") || !styles.includes("clip-path: inset(0 round 0)")) throw new Error("The centered 30-to-100 percent clip-path reveal is incomplete.");
if (!transition.includes("!transitionDocument.startViewTransition") || !styles.includes("prefers-reduced-motion: reduce")) throw new Error("Unsupported-browser and reduced-motion fallbacks are incomplete.");
if (!transition.includes("anchor.dataset.menuNavigation !== undefined") || !transition.includes('addEventListener("alana:menu-navigation-ready"')) throw new Error("Menu and general-link navigation are not both supported.");

console.log("Sprint 61 centered incoming-page clip-path reveal passed.");
