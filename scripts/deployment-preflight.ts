import { existsSync } from "node:fs";
import process from "node:process";
import mysql from "mysql2/promise";
import { assessDeploymentDatabase } from "../src/lib/deployment-database-contract";
import { auditDeploymentEnvironment, type DeploymentMode } from "../src/lib/deployment-environment";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

async function main() {
  const mode: DeploymentMode = process.argv.includes("--production") ? "production" : "local";
  const environment = auditDeploymentEnvironment(process.env, mode);
  if (!environment.ok || !process.env.DATABASE_URL) {
    process.stdout.write(`${JSON.stringify({ ok: false, stage: "environment", environment }, null, 2)}\n`);
    process.exitCode = 1;
    return;
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    const [tableRows] = await connection.query<mysql.RowDataPacket[]>("SELECT TABLE_NAME AS tableName FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME");
    const tables = tableRows.map((row) => String(row.tableName));
    const hasJournal = tables.includes("__drizzle_migrations");
    const [migrationRows] = hasJournal ? await connection.query<mysql.RowDataPacket[]>("SELECT COUNT(*) AS total FROM `__drizzle_migrations`") : [[]];
    const [ownerRows] = tables.includes("admin_users") ? await connection.query<mysql.RowDataPacket[]>("SELECT COUNT(*) AS total FROM `admin_users` WHERE `role` = 'owner' AND `status` = 'active'") : [[]];
    const database = assessDeploymentDatabase({
      tables,
      migrationCount: Number(migrationRows[0]?.total ?? 0),
      activeOwnerCount: Number(ownerRows[0]?.total ?? 0),
    });
    process.stdout.write(`${JSON.stringify({ ok: environment.ok && database.ok, mode, environment, database }, null, 2)}\n`);
    if (!database.ok) process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`Deployment preflight failed without exposing credentials: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
