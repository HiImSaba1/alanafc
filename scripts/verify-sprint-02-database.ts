import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import mysql from "mysql2/promise";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

async function scalar(connection: mysql.Connection, sql: string): Promise<number> {
  const [rows] = await connection.query<mysql.RowDataPacket[]>(sql);
  return Number(rows[0]?.count ?? 0);
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing.");
  const url = new URL(process.env.DATABASE_URL);
  if (url.pathname.replace(/^\//, "") !== "next_alanafcacademy") throw new Error("Verification is restricted to next_alanafcacademy.");
  const report = JSON.parse(await readFile(resolve("artifacts/verification/sprint-02-migration.json"), "utf8")) as {
    mode: string;
    sourceFingerprint: string;
    totals: { importableDrafts: number; quarantinedContent: number; media: number; redirects: number };
  };
  if (report.mode !== "draft_import") throw new Error("The current Sprint 02 report does not prove a completed draft import.");

  const connection = await mysql.createConnection({ uri: process.env.DATABASE_URL });
  try {
    const actual = {
      drafts: await scalar(connection, "SELECT COUNT(*) AS count FROM content_entries WHERE migration_status='draft'"),
      nonDraftEntries: await scalar(connection, "SELECT COUNT(*) AS count FROM content_entries WHERE migration_status<>'draft'"),
      quarantine: await scalar(connection, "SELECT COUNT(*) AS count FROM content_quarantine"),
      media: await scalar(connection, "SELECT COUNT(*) AS count FROM media_assets"),
      redirects: await scalar(connection, "SELECT COUNT(*) AS count FROM legacy_redirects"),
      completedRuns: await scalar(connection, `SELECT COUNT(*) AS count FROM content_import_runs WHERE source_fingerprint=${connection.escape(report.sourceFingerprint)} AND mode='draft_import' AND status='completed'`),
    };
    const expected = {
      drafts: report.totals.importableDrafts,
      quarantine: report.totals.quarantinedContent,
      media: report.totals.media,
      redirects: report.totals.redirects,
    };
    if (actual.nonDraftEntries !== 0) throw new Error("A non-draft content entry exists.");
    if (actual.completedRuns < 1) throw new Error("No completed import run matches the source fingerprint.");
    for (const key of ["drafts", "quarantine", "media", "redirects"] as const) {
      if (actual[key] !== expected[key]) throw new Error(`${key} count mismatch: expected ${expected[key]}, received ${actual[key]}.`);
    }
    process.stdout.write(`${JSON.stringify({ ok: true, sourceFingerprint: report.sourceFingerprint, expected, actual }, null, 2)}\n`);
  } finally {
    await connection.end();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`Sprint 02 database verification failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
