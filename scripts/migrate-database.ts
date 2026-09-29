import { existsSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { inspect } from "node:util";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
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
    throw new Error("Migration is restricted to the configured DATABASE_NAME.");
  }

  const connection = await mysql.createConnection({
    uri: url,
    multipleStatements: true,
  });

  try {
    await connection.query("SET SESSION default_storage_engine = 'InnoDB'");
    const database = drizzle(connection);
    await migrate(database, {
      migrationsFolder: resolve("database/migrations"),
    });
    process.stdout.write("Database migrations applied successfully.\n");
  } finally {
    await connection.end();
  }
}

main().catch((error: unknown) => {
  const details = inspect(error, { depth: 8, colors: false });
  process.stderr.write(`Database migration failed: ${details}\n`);
  process.exitCode = 1;
});
