import { existsSync } from "node:fs";
import process from "node:process";
import mysql from "mysql2/promise";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

async function main() {
  if (!process.argv.includes("--confirm-partial-reset")) {
    throw new Error("Refusing recovery without --confirm-partial-reset.");
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is missing.");
  const parsed = new URL(url);
  if (parsed.pathname.replace(/^\//, "") !== "next_alanafcacademy") {
    throw new Error("Recovery is restricted to next_alanafcacademy.");
  }

  const connection = await mysql.createConnection(url);
  try {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT TABLE_NAME AS tableName FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME",
    );
    const tables = rows.map((row) => String(row.tableName));
    const allowed = new Set(["__drizzle_migrations", "admin_users", "admin_sessions", "audit_events"]);
    if (tables.length === 0 || tables.some((table) => !allowed.has(table))) {
      throw new Error(`Refusing recovery because the database is not in the expected partial state. Tables: ${tables.join(", ") || "none"}`);
    }

    for (const table of tables.filter((table) => table !== "__drizzle_migrations")) {
      const [countRows] = await connection.query<mysql.RowDataPacket[]>(`SELECT COUNT(*) AS rowCount FROM \`${table}\``);
      if (Number(countRows[0]?.rowCount ?? 0) !== 0) {
        throw new Error(`Refusing recovery because ${table} contains application data.`);
      }
    }

    await connection.query("SET FOREIGN_KEY_CHECKS = 0");
    await connection.query("DROP TABLE IF EXISTS `audit_events`");
    await connection.query("DROP TABLE IF EXISTS `admin_sessions`");
    await connection.query("DROP TABLE IF EXISTS `admin_users`");
    await connection.query("DROP TABLE IF EXISTS `__drizzle_migrations`");
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    process.stdout.write("Removed only the partial Sprint 01 migration tables.\n");
  } finally {
    await connection.end();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`Partial migration recovery failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
