/* eslint-disable @typescript-eslint/no-require-imports -- This safety module executes directly in the packaged CommonJS production migration runner. */
const { createHash } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const BASE_TABLES = [
  "academy_registrations", "admin_sessions", "admin_users", "audit_events",
  "contact_messages", "content_entries", "content_entry_taxonomies",
  "content_import_runs", "content_quarantine", "content_revisions",
  "content_taxonomies", "legacy_redirects", "media_assets",
];
const PRESERVED_TABLES = ["admin_users", "academy_registrations", "content_entries", "contact_messages"];
const ALLOWED_HISTORY_LENGTHS = new Set([9, 10, 11]);

function loadMigrationPlan(applicationRoot) {
  const migrationsRoot = resolve(applicationRoot, "database/migrations");
  const journal = JSON.parse(readFileSync(resolve(migrationsRoot, "meta/_journal.json"), "utf8"));
  const entries = journal.entries.map((entry) => {
    const sql = readFileSync(resolve(migrationsRoot, `${entry.tag}.sql`), "utf8");
    return { ...entry, hash: createHash("sha256").update(sql).digest("hex") };
  });
  const expectedTags = [
    "0000_minor_earthquake", "0001_grey_demogoblin", "0002_sharp_morg",
    "0003_amazing_terrax", "0004_lying_sebastian_shaw", "0005_big_sentinels",
    "0006_salty_guardian", "0007_special_karma", "0008_widen_legacy_redirect_paths",
    "0009_cute_ozymandias", "0010_site_settings",
  ];
  if (entries.map((entry) => entry.tag).join("|") !== expectedTags.join("|")) throw new Error("Migration refused: release migration plan is not the reviewed 0000-0010 history.");
  if (entries[8].when !== 1789891200000 || entries[9].when !== 1789891201000 || entries[10].when !== 1790672400000) throw new Error("Migration refused: reviewed 0008-0010 timestamps changed.");
  return { migrationsRoot, entries };
}

async function tableEngines(connection, databaseName) {
  const [rows] = await connection.query("SELECT TABLE_NAME, ENGINE FROM information_schema.tables WHERE table_schema = ? AND TABLE_NAME IN (?)", [databaseName, [...BASE_TABLES, "site_settings", "__drizzle_migrations"]]);
  return Object.fromEntries(rows.map((row) => [String(row.TABLE_NAME), String(row.ENGINE ?? "").toLowerCase()]));
}

async function rowCounts(connection) {
  const counts = {};
  for (const table of PRESERVED_TABLES) {
    const [rows] = await connection.query(`SELECT COUNT(*) AS row_count FROM \`${table}\``);
    counts[table] = Number(rows[0].row_count);
  }
  return counts;
}

async function assertSiteSettingsContract(connection, databaseName) {
  const [foreignKeys] = await connection.query(
    "SELECT COUNT(*) AS match_count FROM information_schema.key_column_usage k JOIN information_schema.referential_constraints r ON r.constraint_schema = k.constraint_schema AND r.constraint_name = k.constraint_name AND r.table_name = k.table_name WHERE k.table_schema = ? AND k.table_name = 'site_settings' AND k.column_name = 'updated_by_user_id' AND k.referenced_table_name = 'admin_users' AND k.referenced_column_name = 'id' AND r.delete_rule = 'SET NULL'",
    [databaseName],
  );
  const [uniqueIndexes] = await connection.query("SELECT COUNT(*) AS match_count FROM information_schema.statistics WHERE table_schema = ? AND table_name = 'site_settings' AND index_name = 'site_settings_key_unique' AND column_name = 'setting_key' AND non_unique = 0", [databaseName]);
  if (Number(foreignKeys[0].match_count) !== 1 || Number(uniqueIndexes[0].match_count) !== 1) throw new Error("Migration refused: existing site_settings does not match the reviewed FK/index contract.");
}

async function inspectProductionState(connection, databaseName, plan) {
  const [history] = await connection.query("SELECT id, hash, created_at FROM `__drizzle_migrations` ORDER BY id ASC");
  if (!ALLOWED_HISTORY_LENGTHS.has(history.length)) throw new Error(`Migration refused: expected 9, 10, or 11 migration records; found ${history.length}.`);
  for (let index = 0; index < history.length; index += 1) {
    const actual = history[index];
    const expected = plan.entries[index];
    if (!expected || String(actual.hash) !== expected.hash || Number(actual.created_at) !== expected.when) throw new Error(`Migration refused: history row ${index} does not match ${expected?.tag ?? "the reviewed plan"}.`);
  }

  const engines = await tableEngines(connection, databaseName);
  for (const table of BASE_TABLES) {
    if (!engines[table]) throw new Error(`Migration refused: required table ${table} is missing.`);
    if (table !== "admin_users" && engines[table] !== "myisam") throw new Error(`Migration refused: ${table} engine changed from the reviewed MyISAM state.`);
  }
  if (!engines.__drizzle_migrations || engines.__drizzle_migrations !== "myisam") throw new Error("Migration refused: __drizzle_migrations engine changed from the reviewed MyISAM state.");
  if (!new Set(["myisam", "innodb"]).has(engines.admin_users)) throw new Error("Migration refused: admin_users must be MyISAM before conversion or InnoDB during/after the reviewed migration.");

  const [idColumns] = await connection.query("SELECT DATA_TYPE, COLUMN_KEY, IS_NULLABLE FROM information_schema.columns WHERE table_schema = ? AND table_name = 'admin_users' AND column_name = 'id'", [databaseName]);
  if (idColumns.length !== 1 || String(idColumns[0].DATA_TYPE).toLowerCase() !== "int" || idColumns[0].COLUMN_KEY !== "PRI" || idColumns[0].IS_NULLABLE !== "NO") throw new Error("Migration refused: admin_users.id is incompatible with the site_settings foreign key.");

  const [externalReferences] = await connection.query("SELECT table_name FROM information_schema.key_column_usage WHERE referenced_table_schema = ? AND referenced_table_name = 'admin_users' AND table_name <> 'site_settings'", [databaseName]);
  if (externalReferences.length) throw new Error("Migration refused: enforced foreign keys already reference admin_users; engine conversion requires separate review.");

  const hasSiteSettings = Boolean(engines.site_settings);
  if (hasSiteSettings) {
    if (engines.site_settings !== "innodb" || engines.admin_users !== "innodb") throw new Error("Migration refused: site_settings recovery state requires both tables to be InnoDB.");
    await assertSiteSettingsContract(connection, databaseName);
  }
  if (history.length === 11 && !hasSiteSettings) throw new Error("Migration refused: history says 0010 is applied but site_settings is absent.");
  if (history.length === 11 && engines.admin_users !== "innodb") throw new Error("Migration refused: completed history requires admin_users to be InnoDB.");

  return { historyLength: history.length, engines, counts: await rowCounts(connection) };
}

function assertPreservedState(before, after) {
  for (const table of PRESERVED_TABLES) {
    if (before.counts[table] !== after.counts[table]) throw new Error(`Migration failed closed: row count changed for ${table}.`);
  }
  for (const table of BASE_TABLES) {
    if (table !== "admin_users" && before.engines[table] !== after.engines[table]) throw new Error(`Migration failed closed: engine changed unexpectedly for ${table}.`);
  }
  if (after.historyLength !== 11 || after.engines.admin_users !== "innodb" || after.engines.site_settings !== "innodb") throw new Error("Migration failed closed: final reviewed schema/history was not reached.");
}

module.exports = { loadMigrationPlan, inspectProductionState, assertPreservedState };
