import { existsSync } from "node:fs";
import mysql from "mysql2/promise";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing.");
  const url = new URL(process.env.DATABASE_URL);
  if (url.pathname.replace(/^\//, "") !== "next_alanafcacademy") throw new Error("Verification is restricted to next_alanafcacademy.");
  const connection = await mysql.createConnection({ uri: process.env.DATABASE_URL });
  try {
    const requiredColumns = ["reference", "child_name", "child_birth_year", "preferred_group", "guardian_name", "guardian_email", "guardian_phone", "photo_preference", "privacy_consent_at", "status", "email_status", "submitted_at"];
    const [columns] = await connection.execute<mysql.RowDataPacket[]>("SELECT COLUMN_NAME AS columnName FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='academy_registrations'");
    const actual = new Set(columns.map((row) => String(row.columnName ?? row.COLUMN_NAME ?? row.column_name).toLowerCase()));
    const missing = requiredColumns.filter((column) => !actual.has(column));
    if (missing.length) throw new Error(`Missing academy_registrations columns: ${missing.join(", ")}.`);
    const mailKeys = ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "MAIL_FROM", "MAIL_TO"];
    const missingMailKeys = mailKeys.filter((key) => !process.env[key]?.trim());
    if (missingMailKeys.length) throw new Error(`Missing mail configuration keys: ${missingMailKeys.join(", ")}. Values were not printed.`);
    const [rows] = await connection.execute<mysql.RowDataPacket[]>("SELECT COUNT(*) AS total, COALESCE(SUM(email_status='failed'),0) AS failed_emails FROM academy_registrations");
    process.stdout.write(`${JSON.stringify({ ok: true, database: "next_alanafcacademy", table: "academy_registrations", requiredColumns, mailConfigured: true, counts: rows[0] ?? {} }, null, 2)}\n`);
  } finally { await connection.end(); }
}

main().catch((error: unknown) => { process.stderr.write(`Sprint 05 database verification failed: ${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1; });
