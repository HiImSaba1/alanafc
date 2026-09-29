import { existsSync } from "node:fs";
import process from "node:process";
import mysql from "mysql2/promise";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is missing from .env.local.");

  const parsed = new URL(url);
  if (parsed.protocol !== "mysql:") throw new Error("DATABASE_URL must use mysql://.");
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  const expectedDatabase = process.env.DATABASE_NAME?.trim() || "next_alanafcacademy";
  if (database !== expectedDatabase) {
    throw new Error("DATABASE_URL must target the configured DATABASE_NAME.");
  }

  const connection = await mysql.createConnection(url);
  try {
    const [identityRows] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT DATABASE() AS databaseName, CURRENT_USER() AS authenticatedUser",
    );
    const [tableRows] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT TABLE_NAME AS tableName FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME",
    );
    process.stdout.write(`${JSON.stringify({
      ok: true,
      database: identityRows[0]?.databaseName,
      authenticatedUser: identityRows[0]?.authenticatedUser,
      existingTables: tableRows.map((row) => row.tableName),
    }, null, 2)}\n`);
  } finally {
    await connection.end();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`Database preflight failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
