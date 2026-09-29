import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const rawDatabaseUrl = process.env.DATABASE_URL;
if (!rawDatabaseUrl) throw new Error("Local browser tests require DATABASE_URL from .env.local.");

const databaseUrl = new URL(rawDatabaseUrl);
const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
if (!localHosts.has(databaseUrl.hostname)) {
  throw new Error("Local browser tests are blocked because DATABASE_URL does not point to localhost. No connection was attempted.");
}
if (databaseUrl.pathname.replace(/^\//, "") !== "next_alanafcacademy") {
  throw new Error("Local browser tests are restricted to the next_alanafcacademy database.");
}

const playwrightCli = resolve(process.cwd(), "node_modules", "@playwright", "test", "cli.js");
const result = spawnSync(process.execPath, [playwrightCli, "test", ...process.argv.slice(2)], {
  cwd: process.cwd(),
  env: { ...process.env, NEXT_DIST_DIR: process.env.NEXT_DIST_DIR ?? "tmp/next-verification" },
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
