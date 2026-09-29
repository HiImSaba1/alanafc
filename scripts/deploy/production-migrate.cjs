/* eslint-disable @typescript-eslint/no-require-imports -- This migration runner executes directly in the packaged CommonJS release. */
const { existsSync } = require("node:fs");
const { resolve } = require("node:path");
const { inspect } = require("node:util");
const { drizzle } = require("drizzle-orm/mysql2");
const { migrate } = require("drizzle-orm/mysql2/migrator");
const mysql = require("mysql2/promise");

const environmentPath = resolve(__dirname, ".env.production.local");
if (existsSync(environmentPath)) {
  if (typeof process.loadEnvFile !== "function") throw new Error("Node.js 20.12 or newer is required.");
  process.loadEnvFile(environmentPath);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is missing from the private production environment.");
  const parsed = new URL(url);
  if (parsed.protocol !== "mysql:") throw new Error("DATABASE_URL must use mysql://.");
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  const expectedName = process.env.DATABASE_NAME?.trim() || "next_alanafcacademy";
  if (databaseName !== expectedName) throw new Error("Migration refused: DATABASE_URL does not target DATABASE_NAME.");

  const connection = await mysql.createConnection({ uri: url, multipleStatements: true });
  try {
    await connection.query("SET SESSION default_storage_engine = 'InnoDB'");
    const [engines] = await connection.query("SELECT ENGINE FROM information_schema.tables WHERE table_schema = ? AND table_name = 'admin_users'", [databaseName]);
    if (engines.length && String(engines[0].ENGINE).toLowerCase() !== "innodb") throw new Error("Migration refused: admin_users must use InnoDB before adding the site_settings foreign key.");
    await migrate(drizzle(connection), { migrationsFolder: resolve(__dirname, "database/migrations") });
    process.stdout.write("Production database migrations applied successfully. No application data was imported or replaced.\n");
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  process.stderr.write(`Production database migration failed: ${inspect(error, { depth: 5, colors: false })}\n`);
  process.exitCode = 1;
});
