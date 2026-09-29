import { existsSync } from "node:fs";
import mysql from "mysql2/promise";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const confirmed = process.argv.includes("--confirm-publish-imported-posts");

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing.");
  if (process.env.NODE_ENV === "production") throw new Error("Bulk imported-post publishing is disabled in production.");
  const url = new URL(process.env.DATABASE_URL);
  const database = url.pathname.replace(/^\//, "");
  if (database !== "next_alanafcacademy") throw new Error("Publishing is restricted to next_alanafcacademy.");

  const connection = await mysql.createConnection({ uri: process.env.DATABASE_URL });
  try {
    const [beforeRows] = await connection.execute<mysql.RowDataPacket[]>(`SELECT
      COUNT(*) AS eligible,
      COALESCE(SUM(publication_status = 'published'), 0) AS alreadyPublished,
      COALESCE(SUM(publication_status = 'draft'), 0) AS readyToPublish
      FROM content_entries
      WHERE kind = 'post' AND migration_status = 'draft' AND source_status = 'publish'`);
    const before = beforeRows[0] ?? {};

    if (!confirmed) {
      process.stdout.write(`${JSON.stringify({ ok: true, mode: "dry_run", database, eligible: Number(before.eligible), alreadyPublished: Number(before.alreadyPublished), readyToPublish: Number(before.readyToPublish), writesPerformed: false }, null, 2)}\n`);
      return;
    }

    const [result] = await connection.execute<mysql.ResultSetHeader>(`UPDATE content_entries
      SET publication_status = 'published', published_at = COALESCE(published_at, created_at)
      WHERE kind = 'post'
        AND migration_status = 'draft'
        AND source_status = 'publish'
        AND publication_status = 'draft'`);

    process.stdout.write(`${JSON.stringify({ ok: true, mode: "confirmed_local_publish", database, eligible: Number(before.eligible), publishedNow: result.affectedRows, writesPerformed: true }, null, 2)}\n`);
  } finally {
    await connection.end();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`Imported post publishing failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
