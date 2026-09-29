import { existsSync } from "node:fs";
import mysql from "mysql2/promise";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const TABLES = [
  "content_entry_taxonomies",
  "content_quarantine",
  "content_taxonomies",
  "content_entries",
  "content_import_runs",
] as const;

async function main() {
  if (!process.argv.includes("--confirm-partial-reset")) throw new Error("Missing --confirm-partial-reset.");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing.");
  const url = new URL(process.env.DATABASE_URL);
  if (url.pathname.replace(/^\//, "") !== "next_alanafcacademy") throw new Error("Recovery is restricted to next_alanafcacademy.");
  const connection = await mysql.createConnection({ uri: process.env.DATABASE_URL });
  try {
    const [migrationRows] = await connection.execute<mysql.RowDataPacket[]>("SELECT COUNT(*) AS count FROM __drizzle_migrations");
    if (Number(migrationRows[0]?.count) !== 2) throw new Error("Expected exactly the two completed Sprint 01 migrations; refusing recovery.");
    for (const table of TABLES) {
      const [exists] = await connection.execute<mysql.RowDataPacket[]>(
        "SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=?",
        [table],
      );
      if (!Number(exists[0]?.count)) continue;
      const [rows] = await connection.query<mysql.RowDataPacket[]>(`SELECT COUNT(*) AS count FROM \`${table}\``);
      if (Number(rows[0]?.count) !== 0) throw new Error(`${table} contains data; refusing recovery.`);
    }
    await connection.query("SET FOREIGN_KEY_CHECKS=0");
    try {
      for (const table of TABLES) await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
    } finally {
      await connection.query("SET FOREIGN_KEY_CHECKS=1");
    }
    process.stdout.write("Removed only empty partial Sprint 02 migration tables.\n");
  } finally {
    await connection.end();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`Sprint 02 partial recovery failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
