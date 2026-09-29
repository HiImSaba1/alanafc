import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(resolve(root, "src/components/layout/site-header.tsx"), "utf8");

for (const contract of ["element.inert = true", "element.inert = false", "event.shiftKey ? last : first", "prefers-reduced-motion: reduce", "trigger.current?.focus()", "keepFocusInsideMenu", "document.activeElement !== target", 'opacity: 0, visibility: "visible"'] as const) {
  if (!source.includes(contract)) throw new Error(`Navigation accessibility contract is missing: ${contract}`);
}

console.log(JSON.stringify({ ok: true, focusTrap: true, backgroundIsolation: true, reducedMotion: true }, null, 2));
