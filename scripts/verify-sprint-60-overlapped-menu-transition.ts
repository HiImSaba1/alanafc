import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const header = read("src/components/layout/site-header.tsx");
const transition = read("src/components/motion/page-transition.tsx");
const privacy = read("src/app/privacy/page.tsx");

if (!header.includes("navigateFromOpenMenu") || !header.includes('new CustomEvent("alana:menu-navigation-ready"')) throw new Error("Open-menu navigation is not handed directly to the page transition.");
if (!transition.includes("startViewTransition") || !transition.includes('new Event("alana:view-transition-captured")')) throw new Error("The outgoing open-menu snapshot is not coordinated with the incoming reveal.");
if (!header.includes('addEventListener("alana:view-transition-captured"') || !header.includes("setOpen(false)")) throw new Error("The live menu is not closed after snapshot capture.");
if (!privacy.includes('import Link from "next/link"') || !privacy.includes('<Link href="/cookies">')) throw new Error("The privacy page still uses a raw internal anchor.");

console.log("Sprint 60 overlapped menu-close and page-transition timing passed.");
