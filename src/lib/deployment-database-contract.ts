export const requiredApplicationTables = [
  "admin_users",
  "admin_sessions",
  "audit_events",
  "content_import_runs",
  "media_assets",
  "content_entries",
  "content_taxonomies",
  "content_entry_taxonomies",
  "content_revisions",
  "legacy_redirects",
  "content_quarantine",
  "academy_registrations",
  "site_settings",
  "contact_messages",
] as const;

export function assessDeploymentDatabase(input: { tables: string[]; migrationCount: number; activeOwnerCount: number }) {
  const actual = new Set(input.tables.map((table) => table.toLowerCase()));
  const missingTables = requiredApplicationTables.filter((table) => !actual.has(table));
  const errors: string[] = [];
  if (missingTables.length) errors.push(`Missing ${missingTables.length} required application table(s): ${missingTables.join(", ")}.`);
  if (!actual.has("__drizzle_migrations") || input.migrationCount < 1) errors.push("The Drizzle migration journal is missing or empty.");
  if (input.activeOwnerCount < 1) errors.push("No active owner account is available.");
  return { ok: errors.length === 0, requiredTableCount: requiredApplicationTables.length, missingTables, migrationCount: input.migrationCount, activeOwnerCount: input.activeOwnerCount, errors };
}
