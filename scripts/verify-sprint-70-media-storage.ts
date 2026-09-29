import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const storage = read("src/lib/media-storage.ts");
const tests = read("src/lib/media-storage.test.ts");
const actions = read("src/features/content/media-actions.ts");
const preflight = read("scripts/check-media-storage.ts");
const sprint = read("scripts/sprint-70.ps1");

if (!storage.includes('MEDIA_PUBLIC_PREFIX = "/uploads/media"') || !storage.includes("isContainedPath(publicRoot, uploadDirectory)")) throw new Error("Public media storage is not path-contained.");
if (!storage.includes("basename(filename) !== filename") || !tests.includes("rejects traversal and nested filenames")) throw new Error("Media filename traversal protection is incomplete.");
if (!actions.includes("mediaStoragePaths()") || !actions.includes("mediaPublicPath(filename)")) throw new Error("Runtime image derivatives do not use the shared storage contract.");
if (!preflight.includes("constants.W_OK") || !preflight.includes("statfs(writableAncestor)") || !preflight.includes("MINIMUM_AVAILABLE_BYTES")) throw new Error("Read-only writability or free-space checks are incomplete.");
if (/writeFile|mkdir|unlink|rm\(/.test(preflight)) throw new Error("Media storage preflight must not mutate the filesystem.");
if (!sprint.includes("run-flat-sprint-contracts.ps1") || !sprint.includes("media-storage:check")) throw new Error("Sprint 70 does not use the flat cumulative runner and media preflight.");

console.log("Sprint 70 contained and read-only media storage readiness passed.");
