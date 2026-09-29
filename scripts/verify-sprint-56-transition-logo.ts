import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const transition = read("src/components/motion/page-transition.tsx");
const styles = read("src/app/globals.css");
if (transition.includes('import Image from "next/image"') || transition.includes("data-transition-logo") || transition.includes("new-logo-png-alana_main.png")) throw new Error("The removed logo overlay is still present.");
if (!transition.includes("startViewTransition") || !styles.includes("::view-transition-new(root)")) throw new Error("The replacement incoming-page reveal is missing.");

console.log("Sprint 56 legacy logo-overlay removal contract passed.");
