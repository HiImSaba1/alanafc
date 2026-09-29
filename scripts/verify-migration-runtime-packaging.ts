import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const build = read("scripts/deploy/build-artifact.sh");
const stage = read("scripts/deploy/stage-migration-runtime.mjs");
const verify = read("scripts/deploy/verify-artifact.sh");
const runner = read("scripts/deploy/production-migrate.cjs");

if (!build.includes('node scripts/deploy/stage-migration-runtime.mjs "$release_dir"')) {
  throw new Error("The artifact build does not stage the migration runtime closure.");
}
if (!stage.includes('["drizzle-orm", "mysql2"]') || !stage.includes("manifest.dependencies") || !stage.includes("manifest.optionalDependencies")) {
  throw new Error("Migration runtime staging must include Drizzle, mysql2, and their installed runtime dependency closure.");
}
if (!stage.includes('releaseRequire.resolve(request)')) {
  throw new Error("Migration runtime staging does not verify release-local module resolution.");
}
if (!runner.includes("if (require.main === module)") || !runner.includes("module.exports = { main }")) {
  throw new Error("The migration runner cannot be safely loaded without executing a migration.");
}
if (!verify.includes('require("./migrate.js")') || !verify.includes("require.resolve(request)")) {
  throw new Error("Artifact verification does not load the packaged migration runner and its required modules.");
}
if (!verify.includes("env -u DATABASE_URL -u DATABASE_NAME")) {
  throw new Error("The migration runtime load probe must run without database configuration.");
}

process.stdout.write("Migration runtime packaging contract passed without connecting to a database.\n");
