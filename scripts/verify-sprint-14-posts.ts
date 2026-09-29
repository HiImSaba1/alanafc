import { existsSync } from "node:fs";
import mysql from "mysql2/promise";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing.");
  const url = new URL(process.env.DATABASE_URL);
  if (url.pathname.replace(/^\//, "") !== "next_alanafcacademy") throw new Error("Verification is restricted to next_alanafcacademy.");
  const connection = await mysql.createConnection({ uri: process.env.DATABASE_URL });
  try {
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(`SELECT
      COUNT(*) AS eligible,
      COALESCE(SUM(publication_status = 'published'), 0) AS published,
      COALESCE(SUM(publication_status = 'draft'), 0) AS remainingDrafts
      FROM content_entries
      WHERE kind = 'post' AND migration_status = 'draft' AND source_status = 'publish'`);
    const counts = rows[0] ?? {};
    if (Number(counts.eligible) < 1) throw new Error("No eligible imported WordPress posts were found.");
    if (Number(counts.remainingDrafts) !== 0) throw new Error("Eligible imported WordPress posts remain unpublished.");
    process.stdout.write(`${JSON.stringify({ ok: true, database: "next_alanafcacademy", counts }, null, 2)}\n`);
  } finally {
    await connection.end();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`Sprint 14 post verification failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
