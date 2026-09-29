import { existsSync } from "node:fs";
import mysql from "mysql2/promise";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing.");
  const url = new URL(process.env.DATABASE_URL);
  if (url.pathname.replace(/^\//, "") !== "next_alanafcacademy") throw new Error("Verification is restricted to next_alanafcacademy.");
  const connection = await mysql.createConnection({ uri: process.env.DATABASE_URL });
  try {
    const requiredColumns = ["publication_status", "scheduled_for", "gallery_media_external_ids"];
    const [columns] = await connection.execute<mysql.RowDataPacket[]>(
      "SELECT COLUMN_NAME AS columnName FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'content_entries'",
    );
    const actualColumns = new Set(
      columns.map((item) => String(item.columnName ?? item.COLUMN_NAME ?? item.column_name).toLowerCase()),
    );
    const missingColumns = requiredColumns.filter((column) => !actualColumns.has(column));
    if (missingColumns.length > 0) {
      throw new Error(
        `Missing content_entries columns: ${missingColumns.join(", ")}. Found: ${[...actualColumns].sort().join(", ") || "none"}.`,
      );
    }
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(`SELECT
      COUNT(*) AS total,
      COALESCE(SUM(migration_status='draft'), 0) AS migration_safe,
      COALESCE(SUM(publication_status='draft'), 0) AS drafts,
      COALESCE(SUM(publication_status='published'), 0) AS published,
      COALESCE(SUM(publication_status='scheduled'), 0) AS scheduled,
      COALESCE(SUM(publication_status='archived'), 0) AS archived,
      COALESCE(SUM(migration_status='quarantined'), 0) AS unsafe_rows
      FROM content_entries`);
    const counts = rows[0] ?? {};
    if (Number(counts.unsafe_rows) !== 0) throw new Error("Quarantined content exists in the publishable content table.");
    process.stdout.write(`${JSON.stringify({ ok: true, database: "next_alanafcacademy", columns: requiredColumns, counts }, null, 2)}\n`);
  } finally { await connection.end(); }
}

main().catch((error: unknown) => {
  process.stderr.write(`Sprint 04 database verification failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
