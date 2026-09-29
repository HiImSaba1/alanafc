import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { createRequire } from "node:module";

const [releaseArgument] = process.argv.slice(2);
if (!releaseArgument) throw new Error("Usage: node stage-migration-runtime.mjs <release-directory>");

const projectRoot = process.cwd();
const installedRoot = realpathSync(resolve(projectRoot, "node_modules"));
const releaseRoot = resolve(projectRoot, releaseArgument);
const releaseModules = resolve(releaseRoot, "node_modules");
const visited = new Set();

function packageRootFromEntry(entryPath, expectedName) {
  let cursor = dirname(realpathSync(entryPath));
  while (cursor.startsWith(installedRoot + sep) || cursor === installedRoot) {
    const manifestPath = join(cursor, "package.json");
    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      if (manifest.name === expectedName) return { root: cursor, manifest };
    }
    const parent = dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  throw new Error(`Could not locate installed package root for ${expectedName}.`);
}

function resolvePackage(name, fromManifest = join(projectRoot, "package.json")) {
  const entry = createRequire(fromManifest).resolve(name);
  return packageRootFromEntry(entry, name);
}

function stage(name, fromManifest) {
  const { root, manifest } = resolvePackage(name, fromManifest);
  const canonicalRoot = realpathSync(root);
  if (visited.has(canonicalRoot)) return;
  visited.add(canonicalRoot);

  const sourceRelativePath = relative(installedRoot, canonicalRoot);
  if (!sourceRelativePath || sourceRelativePath.startsWith("..") || isAbsolute(sourceRelativePath)) {
    throw new Error(`Refusing to package ${name} from outside the installed node_modules tree.`);
  }

  const targetRoot = resolve(releaseModules, sourceRelativePath);
  mkdirSync(dirname(targetRoot), { recursive: true });
  cpSync(canonicalRoot, targetRoot, {
    recursive: true,
    force: true,
    filter: (source) => !source.split(sep).includes(".cache"),
  });

  const runtimeDependencies = { ...manifest.dependencies, ...manifest.optionalDependencies };
  const packageManifest = join(canonicalRoot, "package.json");
  for (const dependency of Object.keys(runtimeDependencies).sort()) {
    try {
      stage(dependency, packageManifest);
    } catch (error) {
      if (manifest.optionalDependencies?.[dependency]) continue;
      throw error;
    }
  }
}

mkdirSync(releaseModules, { recursive: true });
for (const seed of ["drizzle-orm", "mysql2"]) stage(seed);

const releaseRequire = createRequire(join(releaseRoot, "migrate.js"));
for (const request of ["drizzle-orm/mysql2", "drizzle-orm/mysql2/migrator", "mysql2/promise"]) {
  releaseRequire.resolve(request);
}

process.stdout.write(`Staged migration runtime closure (${visited.size} packages).\n`);
