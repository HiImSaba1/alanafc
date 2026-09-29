import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const transition = read("src/components/motion/page-transition.tsx");
const styles = read("src/app/globals.css");

if (!transition.includes("transitionLocked") || !transition.includes("|| transitionLocked.current) return") || !transition.includes("transitionLocked.current = true") || !transition.includes("transitionLocked.current = false")) throw new Error("Duplicate navigation is not locked and released safely during transitions.");
if (!transition.includes('setAttribute("aria-busy", "true")') || !transition.includes('removeAttribute("aria-busy")')) throw new Error("The document busy state is incomplete.");
if (!transition.includes("routeSafetyTimer") || !transition.includes("5000") || !transition.includes("transition.finished.then(finish, finish)")) throw new Error("Stalled or failed navigation cannot safely recover.");
if (!transition.includes('querySelector<HTMLElement>("main")') || !transition.includes('setAttribute("tabindex", "-1")') || !transition.includes("main.focus({ preventScroll: true })")) throw new Error("Keyboard focus is not restored to new page content.");
if (!transition.includes('prefers-reduced-motion: reduce') || !transition.includes("focusMain()")) throw new Error("Reduced-motion navigation does not preserve focus recovery.");
if (!styles.includes('html[data-page-transitioning="true"]') || !styles.includes('main[tabindex="-1"]:focus')) throw new Error("Transition feedback or focus styling is missing.");

console.log("Sprint 58 resilient and accessible route transitions passed.");
