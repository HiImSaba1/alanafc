import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runtimeRecoveryCopy } from "../src/lib/runtime-recovery";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const boundaries = ["src/app/error.tsx", "src/app/global-error.tsx"];

for (const boundary of boundaries) {
  const path = resolve(projectRoot, boundary);
  if (!existsSync(path)) throw new Error(`Missing runtime recovery boundary: ${boundary}`);
  const source = readFileSync(path, "utf8");
  if (!source.includes("reset")) throw new Error(`${boundary} does not expose a retry action.`);
  if (source.includes("error.message") || source.includes("error.stack")) throw new Error(`${boundary} exposes private error details.`);
}

if (!runtimeRecoveryCopy.home || !runtimeRecoveryCopy.retry) throw new Error("Runtime recovery actions are incomplete.");

console.log(JSON.stringify({ ok: true, boundaries, privateErrorDetailsExposed: false }, null, 2));
