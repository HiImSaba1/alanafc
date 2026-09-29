import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const [releaseRoot, outputPath, gitCommit, buildTimestamp] = process.argv.slice(2);
if (!releaseRoot || !outputPath || !gitCommit || !buildTimestamp) throw new Error("Usage: node generate-manifest.mjs <release-root> <output> <git-sha> <timestamp>");
const filesBelow = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => { const absolute = join(directory, entry.name); return entry.isDirectory() ? filesBelow(absolute) : [absolute]; });
const sha256 = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
const compareVersions = (left, right) => { const a = left.split(".").map(Number); const b = right.split(".").map(Number); for (let index = 0; index < Math.max(a.length, b.length); index += 1) { const difference = (a[index] ?? 0) - (b[index] ?? 0); if (difference) return difference; } return 0; };
const glibcVersions = (file) => [...new Set(execFileSync("strings", ["-a", file], { encoding: "utf8", maxBuffer: 128 * 1024 * 1024 }).match(/GLIBC_\d+(?:\.\d+)*/g) ?? [])].map((value) => value.replace("GLIBC_", "")).sort(compareVersions);
const packageJson = JSON.parse(readFileSync(join(releaseRoot, "package.json"), "utf8"));
const nativeBinaries = filesBelow(releaseRoot).filter((file) => /(?:\.node|\.so(?:\.\d+)*)$/.test(file)).sort().map((file) => { const versions = glibcVersions(file); return { path: relative(releaseRoot, file).replaceAll("\\", "/"), bytes: statSync(file).size, sha256: sha256(file), glibcVersions: versions, highestGlibcVersion: versions.at(-1) ?? null }; });
const glibcTarget = "2.28";
const incompatible = nativeBinaries.filter((item) => item.highestGlibcVersion && compareVersions(item.highestGlibcVersion, glibcTarget) > 0);
if (incompatible.length) throw new Error(`Native runtime compatibility failed for GLIBC_${glibcTarget}:\n${incompatible.map((item) => `${item.path} requires GLIBC_${item.highestGlibcVersion}`).join("\n")}`);
writeFileSync(outputPath, `${JSON.stringify({ application: "alanafc-web", gitCommit, nextVersion: packageJson.dependencies?.next ?? null, nodeVersion: process.version, npmVersion: execFileSync("npm", ["--version"], { encoding: "utf8" }).trim(), buildTimestamp, buildId: readFileSync(join(releaseRoot, ".next", "BUILD_ID"), "utf8").trim(), nativeCompatibility: { glibcTarget, compatible: true, highestRequiredVersion: nativeBinaries.map((item) => item.highestGlibcVersion).filter(Boolean).sort(compareVersions).at(-1) ?? null }, nativeBinaries }, null, 2)}\n`, "utf8");
