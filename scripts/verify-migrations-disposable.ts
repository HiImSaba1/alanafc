import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql, { type Connection, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";

if (process.argv[2] !== "--confirm-disposable-local-migration-check") throw new Error("Refusing to create disposable databases without the explicit confirmation flag.");
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const sourceUrl = process.env.DATABASE_URL;
if (!sourceUrl) throw new Error("DATABASE_URL is required in .env.local.");
const parsed = new URL(sourceUrl);
if (parsed.protocol !== "mysql:" || !["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)) throw new Error("Disposable migration verification is restricted to a local MySQL server.");

const suffix = `${process.pid}_${Date.now()}`;
const freshName = `next_alanafcacademy_migration_check_fresh_${suffix}`;
const upgradeName = `next_alanafcacademy_migration_check_upgrade_${suffix}`;
const allowedPrefix = "next_alanafcacademy_migration_check_";
const scratch = mkdtempSync(join(tmpdir(), "alanafc-migrations-"));
const historicalFolder = join(scratch, "historical");

function quotedIdentifier(value: string) {
  if (!value.startsWith(allowedPrefix) || !/^[a-z0-9_]+$/.test(value)) throw new Error("Unsafe disposable database identifier.");
  return `\`${value}\``;
}

function connectionOptions(database?: string) {
  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database,
    multipleStatements: true,
  };
}

async function applyMigrations(connection: Connection, folder: string) {
  await migrate(drizzle(connection), { migrationsFolder: folder });
}

async function scalar(connection: Connection, sql: string, values: unknown[] = []) {
  const [rows] = await connection.query<RowDataPacket[]>(sql, values);
  return Number(rows[0]?.value ?? 0);
}

function productionDatabaseUrl(databaseName: string) {
  const target = new URL(sourceUrl!);
  target.pathname = `/${databaseName}`;
  return target.toString();
}

function runPackagedMigration(databaseName: string) {
  const result = spawnSync(process.execPath, [resolve("scripts/deploy/production-migrate.cjs")], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: productionDatabaseUrl(databaseName), DATABASE_NAME: databaseName },
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error(`Packaged production migration failed for the disposable database: ${result.stderr || result.stdout}`);
}

async function main() {
  const admin = await mysql.createConnection(connectionOptions());
  try {
    await admin.query(`CREATE DATABASE ${quotedIdentifier(freshName)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await admin.query(`CREATE DATABASE ${quotedIdentifier(upgradeName)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

    const journal = JSON.parse(readFileSync(resolve("database/migrations/meta/_journal.json"), "utf8")) as { entries: Array<{ idx: number; tag: string }> };
    const historicalEntries = journal.entries.filter((entry) => entry.idx <= 8);
    mkdirSync(join(historicalFolder, "meta"), { recursive: true });
    writeFileSync(join(historicalFolder, "meta/_journal.json"), JSON.stringify({ ...journal, entries: historicalEntries }, null, 2));
    for (const entry of historicalEntries) cpSync(resolve(`database/migrations/${entry.tag}.sql`), join(historicalFolder, `${entry.tag}.sql`));

    const fresh = await mysql.createConnection(connectionOptions(freshName));
    try {
      await fresh.query("SET SESSION default_storage_engine = 'InnoDB'");
      await applyMigrations(fresh, resolve("database/migrations"));
      const migrations = await scalar(fresh, "SELECT COUNT(*) AS value FROM `__drizzle_migrations`");
      const settingsTables = await scalar(fresh, "SELECT COUNT(*) AS value FROM information_schema.tables WHERE table_schema = ? AND table_name = 'site_settings'", [freshName]);
      const foreignKeys = await scalar(fresh, "SELECT COUNT(*) AS value FROM information_schema.key_column_usage k JOIN information_schema.referential_constraints r ON r.constraint_schema = k.constraint_schema AND r.constraint_name = k.constraint_name AND r.table_name = k.table_name WHERE k.table_schema = ? AND k.table_name = 'site_settings' AND k.column_name = 'updated_by_user_id' AND k.referenced_table_name = 'admin_users' AND k.referenced_column_name = 'id' AND r.delete_rule = 'SET NULL'", [freshName]);
      if (migrations !== journal.entries.length || settingsTables !== 1 || foreignKeys !== 1) throw new Error("Fresh migration did not apply the complete canonical history and foreign key exactly once.");
    } finally {
      await fresh.end();
    }

    const upgrade = await mysql.createConnection(connectionOptions(upgradeName));
    let upgradeClosed = false;
    try {
      await upgrade.query("SET SESSION default_storage_engine = 'MyISAM'");
      await applyMigrations(upgrade, historicalFolder);
      await upgrade.execute("INSERT INTO admin_users (username, display_name, password_hash, role, status) VALUES (?, ?, ?, 'owner', 'active')", ["migration-check-owner", "Migration Check Owner", "not-a-real-password-hash"]);
      await upgrade.execute("INSERT INTO academy_registrations (reference, child_name, child_birth_year, preferred_group, guardian_name, guardian_relationship, guardian_email, guardian_phone, privacy_consent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())", ["MIGRATION-CHECK-001", "Migration Check Child", 2016, "K10", "Migration Check Guardian", "Γονέας", "migration-check@example.invalid", "+300000000000"]);
      await upgrade.execute("INSERT INTO content_entries (external_id, kind, slug, title, body_html, source_status, migration_status, source_checksum) VALUES (?, 'post', ?, ?, ?, 'publish', 'draft', ?)", ["migration-check-content", "migration-check-content", "Migration Check Content", "<p>Migration check content</p>", "migration-check-checksum"]);
      const [sentinelsBefore] = await upgrade.query<RowDataPacket[]>("SELECT (SELECT JSON_OBJECT('username', username, 'display_name', display_name, 'role', role, 'status', status) FROM admin_users WHERE username = 'migration-check-owner') AS admin_row, (SELECT JSON_OBJECT('reference', reference, 'child_name', child_name, 'guardian_email', guardian_email, 'status', status) FROM academy_registrations WHERE reference = 'MIGRATION-CHECK-001') AS registration_row, (SELECT JSON_OBJECT('external_id', external_id, 'slug', slug, 'title', title, 'body_html', body_html) FROM content_entries WHERE external_id = 'migration-check-content') AS content_row");
      const migrationsBefore = await scalar(upgrade, "SELECT COUNT(*) AS value FROM `__drizzle_migrations`");
      const [enginesBefore] = await upgrade.query<RowDataPacket[]>("SELECT table_name, engine FROM information_schema.tables WHERE table_schema = ? AND table_name <> 'information_schema'", [upgradeName]);
      if (migrationsBefore !== 9 || enginesBefore.some((row) => String(row.ENGINE).toLowerCase() !== "myisam")) throw new Error("Disposable production simulation does not match the reviewed nine-record MyISAM state.");

      await upgrade.end();
      upgradeClosed = true;
      runPackagedMigration(upgradeName);

      const verified = await mysql.createConnection(connectionOptions(upgradeName));
      try {
        const [sentinelsAfter] = await verified.query<RowDataPacket[]>("SELECT (SELECT JSON_OBJECT('username', username, 'display_name', display_name, 'role', role, 'status', status) FROM admin_users WHERE username = 'migration-check-owner') AS admin_row, (SELECT JSON_OBJECT('reference', reference, 'child_name', child_name, 'guardian_email', guardian_email, 'status', status) FROM academy_registrations WHERE reference = 'MIGRATION-CHECK-001') AS registration_row, (SELECT JSON_OBJECT('external_id', external_id, 'slug', slug, 'title', title, 'body_html', body_html) FROM content_entries WHERE external_id = 'migration-check-content') AS content_row");
        if (JSON.stringify(sentinelsAfter[0]) !== JSON.stringify(sentinelsBefore[0])) throw new Error("Sentinel admin, registration, or content data changed during the production-state upgrade.");
        const migrationsAfter = await scalar(verified, "SELECT COUNT(*) AS value FROM `__drizzle_migrations`");
        const settingsTables = await scalar(verified, "SELECT COUNT(*) AS value FROM information_schema.tables WHERE table_schema = ? AND table_name = 'site_settings' AND engine = 'InnoDB'", [upgradeName]);
        const adminInnoDb = await scalar(verified, "SELECT COUNT(*) AS value FROM information_schema.tables WHERE table_schema = ? AND table_name = 'admin_users' AND engine = 'InnoDB'", [upgradeName]);
        const remainingMyIsam = await scalar(verified, "SELECT COUNT(*) AS value FROM information_schema.tables WHERE table_schema = ? AND table_name NOT IN ('admin_users', 'site_settings') AND engine <> 'MyISAM'", [upgradeName]);
        const sourcePathLength = await scalar(verified, "SELECT CHARACTER_MAXIMUM_LENGTH AS value FROM information_schema.columns WHERE table_schema = ? AND table_name = 'legacy_redirects' AND column_name = 'source_path'", [upgradeName]);
        const foreignKeys = await scalar(verified, "SELECT COUNT(*) AS value FROM information_schema.key_column_usage k JOIN information_schema.referential_constraints r ON r.constraint_schema = k.constraint_schema AND r.constraint_name = k.constraint_name AND r.table_name = k.table_name WHERE k.table_schema = ? AND k.table_name = 'site_settings' AND k.column_name = 'updated_by_user_id' AND k.referenced_table_name = 'admin_users' AND k.referenced_column_name = 'id' AND r.delete_rule = 'SET NULL'", [upgradeName]);
        if (migrationsAfter !== 11 || settingsTables !== 1 || adminInnoDb !== 1 || remainingMyIsam !== 0 || sourcePathLength !== 240 || foreignKeys !== 1) throw new Error("Production-state upgrade did not reach the reviewed 0009/0010 schema and engine contract.");

        const [temporaryOwner] = await verified.execute<ResultSetHeader>("INSERT INTO admin_users (username, display_name, password_hash, role, status) VALUES (?, ?, ?, 'editor', 'active')", ["fk-delete-check", "FK Delete Check", "not-a-real-password-hash"]);
        await verified.execute("INSERT INTO site_settings (setting_key, value_json, updated_by_user_id) VALUES ('fk-delete-check', JSON_OBJECT('ok', true), ?)", [temporaryOwner.insertId]);
        await verified.execute("DELETE FROM admin_users WHERE id = ?", [temporaryOwner.insertId]);
        const nullifiedOwners = await scalar(verified, "SELECT COUNT(*) AS value FROM site_settings WHERE setting_key = 'fk-delete-check' AND updated_by_user_id IS NULL");
        if (nullifiedOwners !== 1) throw new Error("site_settings ON DELETE SET NULL behavior failed.");

        runPackagedMigration(upgradeName);
        const migrationsAfterRerun = await scalar(verified, "SELECT COUNT(*) AS value FROM `__drizzle_migrations`");
        if (migrationsAfterRerun !== 11) throw new Error("Rerunning the fully migrated production command was not idempotent.");
      } finally {
        await verified.end();
      }
    } finally {
      if (!upgradeClosed) await upgrade.end();
    }

    process.stdout.write(`${JSON.stringify({ ok: true, freshHistory: "0000-0010", productionSimulation: "0000-0008 recorded at reviewed timestamps; 0009 and 0010 pending", preservedSentinelData: true, convertedEngines: ["admin_users"], unchangedEngines: "all other application and migration tables remain MyISAM", siteSettingsForeignKey: "admin_users.id ON DELETE SET NULL", deleteRuleVerified: true, rerunIdempotent: true, productionConnected: false }, null, 2)}\n`);
  } finally {
    for (const name of [freshName, upgradeName]) await admin.query(`DROP DATABASE IF EXISTS ${quotedIdentifier(name)}`);
    await admin.end();
    rmSync(scratch, { recursive: true, force: true });
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`Disposable migration verification failed: ${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
