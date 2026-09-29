import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = process.cwd();
const probeRoot = mkdtempSync(join(tmpdir(), "alanafc-migration-runtime-"));

try {
  cpSync(resolve(projectRoot, "scripts/deploy/production-migrate.cjs"), join(probeRoot, "migrate.js"));
  cpSync(resolve(projectRoot, "scripts/deploy/production-migration-safety.cjs"), join(probeRoot, "production-migration-safety.cjs"));

  const stage = spawnSync(
    process.execPath,
    [resolve(projectRoot, "scripts/deploy/stage-migration-runtime.mjs"), probeRoot],
    { cwd: projectRoot, encoding: "utf8" },
  );
  if (stage.status !== 0) throw new Error(stage.stderr || stage.stdout || "Migration runtime staging failed.");

  const environment = { ...process.env };
  delete environment.DATABASE_URL;
  delete environment.DATABASE_NAME;
  const load = spawnSync(
    process.execPath,
    [
      "-e",
      'for (const request of ["drizzle-orm/mysql2", "drizzle-orm/mysql2/migrator", "mysql2/promise"]) require.resolve(request); const runner=require("./migrate.js"); if(typeof runner.main!=="function") process.exit(2);',
    ],
    { cwd: probeRoot, env: environment, encoding: "utf8" },
  );
  if (load.status !== 0) throw new Error(load.stderr || load.stdout || "Packaged migration runner load probe failed.");

  process.stdout.write("Migration runner and its staged runtime dependencies loaded without database access.\n");
} finally {
  rmSync(probeRoot, { recursive: true, force: true });
}
