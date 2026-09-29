import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const nextCli = resolve(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const result = spawnSync(process.execPath, [nextCli, "build", "--webpack"], {
  cwd: process.cwd(),
  env: { ...process.env, NEXT_DIST_DIR: "tmp/next-verification" },
  stdio: "inherit",
  windowsHide: true,
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
