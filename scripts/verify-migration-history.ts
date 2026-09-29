import { readFileSync, readdirSync } from "node:fs";
import { basename, resolve } from "node:path";

type JournalEntry = { idx: number; when: number; tag: string };
type Journal = { entries: JournalEntry[] };
type Snapshot = { id: string; prevId: string; tables: Record<string, { foreignKeys?: Record<string, { tableTo: string; columnsFrom: string[]; columnsTo: string[]; onDelete?: string }> }> };

const root = resolve(process.cwd(), "database/migrations");
const metaRoot = resolve(root, "meta");
const journal = JSON.parse(readFileSync(resolve(metaRoot, "_journal.json"), "utf8")) as Journal;
const sqlFiles = readdirSync(root).filter((file) => /^\d{4}_.+\.sql$/.test(file)).sort();
const journalFiles = journal.entries.map((entry) => `${entry.tag}.sql`);

if (new Set(journalFiles).size !== journalFiles.length) throw new Error("Migration journal contains duplicate tags.");
if (JSON.stringify(sqlFiles) !== JSON.stringify(journalFiles)) throw new Error(`Migration files and journal entries differ. Files=${sqlFiles.join(",")} Journal=${journalFiles.join(",")}`);

for (const [position, entry] of journal.entries.entries()) {
  if (entry.idx !== position) throw new Error(`Migration journal index ${entry.idx} is not sequential at position ${position}.`);
  if (position > 0 && entry.when <= journal.entries[position - 1]!.when) throw new Error(`Migration journal timestamp for ${entry.tag} is not strictly increasing.`);
}

const tableCreators = new Map<string, string[]>();
for (const file of sqlFiles) {
  const sql = readFileSync(resolve(root, file), "utf8");
  for (const match of sql.matchAll(/\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`([^`]+)`/gi)) {
    const table = match[1]!;
    tableCreators.set(table, [...(tableCreators.get(table) ?? []), file]);
  }
}
const duplicates = [...tableCreators].filter(([, files]) => files.length > 1);
if (duplicates.length) throw new Error(`Tables are created by multiple migrations: ${duplicates.map(([table, files]) => `${table} (${files.join(", ")})`).join("; ")}`);

const siteSettingsMigration = tableCreators.get("site_settings") ?? [];
if (siteSettingsMigration.length !== 1 || siteSettingsMigration[0] !== "0010_site_settings.sql") throw new Error("site_settings must be created exactly once by 0010_site_settings.sql.");
const siteSettingsSql = readFileSync(resolve(root, siteSettingsMigration[0]), "utf8");
if (!/FOREIGN KEY \(`updated_by_user_id`\) REFERENCES `admin_users`\(`id`\) ON DELETE set null/i.test(siteSettingsSql)) throw new Error("site_settings owner foreign key must reference admin_users.id with ON DELETE SET NULL.");
if (!/ALTER TABLE `admin_users` ENGINE=InnoDB/i.test(siteSettingsSql) || !/CREATE TABLE IF NOT EXISTS `site_settings`[\s\S]+ENGINE=InnoDB/i.test(siteSettingsSql)) throw new Error("0010 must convert only its FK parent and create site_settings explicitly as InnoDB.");
const engineConversions = [...siteSettingsSql.matchAll(/ALTER\s+TABLE\s+`([^`]+)`\s+ENGINE\s*=\s*InnoDB/gi)].map((match) => match[1]);
if (engineConversions.join(",") !== "admin_users") throw new Error("0010 may convert only admin_users to InnoDB.");
if (/\b(?:DROP|TRUNCATE)\s+(?:TABLE\s+)?`?(?:academy_registrations|contact_messages|content_entries|admin_users)`?/i.test(siteSettingsSql)) throw new Error("site_settings migration contains a destructive application-data statement.");

const latestTag = journal.entries.at(-1)?.tag;
if (!latestTag) throw new Error("Migration journal is empty.");
const latestSnapshotName = `${String(journal.entries.at(-1)!.idx).padStart(4, "0")}_snapshot.json`;
const latestSnapshotPath = resolve(metaRoot, latestSnapshotName);
const latestSnapshot = JSON.parse(readFileSync(latestSnapshotPath, "utf8")) as Snapshot;
const priorSnapshotFiles = readdirSync(metaRoot).filter((file) => /^\d{4}_snapshot\.json$/.test(file) && file !== basename(latestSnapshotPath)).sort();
const priorSnapshot = JSON.parse(readFileSync(resolve(metaRoot, priorSnapshotFiles.at(-1)!), "utf8")) as Snapshot;
if (latestSnapshot.prevId !== priorSnapshot.id) throw new Error(`${basename(latestSnapshotPath)} does not descend from the preceding snapshot.`);
const siteSettingsSnapshot = latestSnapshot.tables.site_settings;
const foreignKey = siteSettingsSnapshot?.foreignKeys?.site_settings_updated_by_user_id_admin_users_id_fk;
if (!foreignKey || foreignKey.tableTo !== "admin_users" || foreignKey.columnsFrom.join() !== "updated_by_user_id" || foreignKey.columnsTo.join() !== "id" || foreignKey.onDelete !== "set null") throw new Error("Latest snapshot does not preserve the required site_settings foreign key.");

const packageJson = readFileSync(resolve(process.cwd(), "package.json"), "utf8");
const startup = readFileSync(resolve(process.cwd(), "scripts/deploy/standalone-start.cjs"), "utf8");
const productionRunner = readFileSync(resolve(process.cwd(), "scripts/deploy/production-migrate.cjs"), "utf8");
const productionSafety = readFileSync(resolve(process.cwd(), "scripts/deploy/production-migration-safety.cjs"), "utf8");
const artifactBuilder = readFileSync(resolve(process.cwd(), "scripts/deploy/build-artifact.sh"), "utf8");
const disposableVerifier = readFileSync(resolve(process.cwd(), "scripts/verify-migrations-disposable.ts"), "utf8");
if (/migrat/i.test(startup)) throw new Error("Application startup must not run migrations automatically.");
if (!packageJson.includes('"db:migrate:production": "node scripts/deploy/production-migrate.cjs"') || !productionRunner.includes("inspectProductionState") || !productionRunner.includes("assertPreservedState") || !productionSafety.includes("ALLOWED_HISTORY_LENGTHS") || !productionSafety.includes("1789891200000") || !productionSafety.includes("row count changed") || !artifactBuilder.includes('production-migration-safety.cjs "$release_dir/production-migration-safety.cjs"')) throw new Error("Explicit production runner, reviewed-state preflight, preservation check, or packaged safety module is missing.");
if (!disposableVerifier.includes("idx <= 8") || !disposableVerifier.includes("default_storage_engine = 'MyISAM'") || !disposableVerifier.includes("MIGRATION-CHECK-001") || !disposableVerifier.includes("migration-check-content") || !disposableVerifier.includes("runPackagedMigration(upgradeName)") || !disposableVerifier.includes("ON DELETE SET NULL behavior failed") || !disposableVerifier.includes("Rerunning the fully migrated production command was not idempotent")) throw new Error("Disposable verification does not simulate the reviewed production migration state and idempotent upgrade.");

process.stdout.write(`${JSON.stringify({ ok: true, migrations: journal.entries.length, latest: latestTag, siteSettingsMigration: siteSettingsMigration[0], duplicateTableCreates: 0, journalStrictlyIncreasing: true, productionMigrationMode: "explicit_manual", writesPerformed: false }, null, 2)}\n`);
