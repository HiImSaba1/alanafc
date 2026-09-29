import { bigint, index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { articleTemplateKeys } from "../content-template-keys";

export const adminUsers = mysqlTable("admin_users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 120 }).notNull(),
  email: varchar("email", { length: 191 }),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["owner", "editor"]).notNull().default("editor"),
  status: mysqlEnum("status", ["active", "disabled"]).notNull().default("active"),
  failedLoginCount: int("failed_login_count").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => [
  uniqueIndex("admin_users_username_unique").on(table.username),
  uniqueIndex("admin_users_email_unique").on(table.email),
]);

export const adminSessions = mysqlTable("admin_sessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [uniqueIndex("admin_sessions_token_unique").on(table.tokenHash), index("admin_sessions_user_idx").on(table.userId)]);

export const auditEvents = mysqlTable("audit_events", {
  id: int("id").autoincrement().primaryKey(),
  actorUserId: int("actor_user_id").references(() => adminUsers.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 80 }),
  entityId: varchar("entity_id", { length: 80 }),
  requestId: varchar("request_id", { length: 64 }).notNull(),
  metadataJson: text("metadata_json"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [index("audit_events_actor_idx").on(table.actorUserId), index("audit_events_created_idx").on(table.createdAt)]);

export const contentImportRuns = mysqlTable("content_import_runs", {
  id: int("id").autoincrement().primaryKey(),
  sourceFingerprint: varchar("source_fingerprint", { length: 64 }).notNull(),
  mode: mysqlEnum("mode", ["dry_run", "draft_import"]).notNull(),
  status: mysqlEnum("status", ["running", "completed", "failed"]).notNull().default("running"),
  reportJson: json("report_json"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => [index("content_import_runs_fingerprint_idx").on(table.sourceFingerprint)]);

export const mediaAssets = mysqlTable("media_assets", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("external_id", { length: 64 }).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  sourceUrl: text("source_url"),
  sourceRelativePath: varchar("source_relative_path", { length: 500 }),
  sha256: varchar("sha256", { length: 64 }),
  mimeType: varchar("mime_type", { length: 100 }),
  byteSize: bigint("byte_size", { mode: "number", unsigned: true }),
  width: int("width", { unsigned: true }),
  height: int("height", { unsigned: true }),
  altText: text("alt_text"),
  caption: text("caption"),
  credit: varchar("credit", { length: 255 }),
  derivativeManifest: json("derivative_manifest"),
  status: mysqlEnum("status", ["ready", "missing", "quarantined"]).notNull().default("missing"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => [
  uniqueIndex("media_assets_external_id_unique").on(table.externalId),
  index("media_assets_sha256_idx").on(table.sha256),
]);

export const contentEntries = mysqlTable("content_entries", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("external_id", { length: 64 }).notNull(),
  kind: mysqlEnum("kind", ["page", "post"]).notNull(),
  slug: varchar("slug", { length: 191 }).notNull(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  bodyHtml: text("body_html").notNull(),
  articleTemplate: mysqlEnum("article_template", [...articleTemplateKeys]).notNull().default("longform"),
  authorName: varchar("author_name", { length: 191 }),
  sourceStatus: varchar("source_status", { length: 40 }).notNull(),
  migrationStatus: mysqlEnum("migration_status", ["draft", "quarantined"]).notNull().default("draft"),
  publicationStatus: mysqlEnum("publication_status", ["draft", "published", "scheduled", "archived"]).notNull().default("draft"),
  sourceUrl: text("source_url"),
  sourceChecksum: varchar("source_checksum", { length: 64 }).notNull(),
  featuredMediaExternalId: varchar("featured_media_external_id", { length: 64 }),
  galleryMediaExternalIds: json("gallery_media_external_ids"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  publishedAt: timestamp("published_at"),
  scheduledFor: timestamp("scheduled_for"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => [
  uniqueIndex("content_entries_external_kind_unique").on(table.externalId, table.kind),
  uniqueIndex("content_entries_slug_kind_unique").on(table.slug, table.kind),
  index("content_entries_migration_status_idx").on(table.migrationStatus),
  index("content_entries_publication_status_idx").on(table.publicationStatus),
  index("content_entries_scheduled_for_idx").on(table.scheduledFor),
]);

export const contentTaxonomies = mysqlTable("content_taxonomies", {
  id: int("id").autoincrement().primaryKey(),
  taxonomy: varchar("taxonomy", { length: 40 }).notNull(),
  slug: varchar("slug", { length: 191 }).notNull(),
  name: varchar("name", { length: 191 }).notNull(),
}, (table) => [uniqueIndex("content_taxonomies_type_slug_unique").on(table.taxonomy, table.slug)]);

export const contentEntryTaxonomies = mysqlTable("content_entry_taxonomies", {
  contentEntryId: int("content_entry_id").notNull().references(() => contentEntries.id, { onDelete: "cascade" }),
  taxonomyId: int("taxonomy_id").notNull().references(() => contentTaxonomies.id, { onDelete: "cascade" }),
}, (table) => [uniqueIndex("content_entry_taxonomies_unique").on(table.contentEntryId, table.taxonomyId)]);

export const contentRevisions = mysqlTable("content_revisions", {
  id: int("id").autoincrement().primaryKey(),
  contentEntryId: int("content_entry_id").notNull().references(() => contentEntries.id, { onDelete: "cascade" }),
  editorUserId: int("editor_user_id").references(() => adminUsers.id, { onDelete: "set null" }),
  revisionNumber: int("revision_number").notNull(),
  snapshot: json("snapshot").notNull(),
  changeSummary: varchar("change_summary", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("content_revisions_entry_number_unique").on(table.contentEntryId, table.revisionNumber),
  index("content_revisions_entry_created_idx").on(table.contentEntryId, table.createdAt),
]);

export const legacyRedirects = mysqlTable("legacy_redirects", {
  id: int("id").autoincrement().primaryKey(),
  sourcePath: varchar("source_path", { length: 240 }).notNull(),
  targetPath: varchar("target_path", { length: 500 }).notNull(),
  statusCode: int("status_code").notNull().default(308),
  sourceExternalId: varchar("source_external_id", { length: 64 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [uniqueIndex("legacy_redirects_source_unique").on(table.sourcePath)]);

export const contentQuarantine = mysqlTable("content_quarantine", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("external_id", { length: 64 }).notNull(),
  postType: varchar("post_type", { length: 40 }).notNull(),
  title: text("title"),
  sourceUrl: text("source_url"),
  reasonJson: json("reason_json").notNull(),
  sourceChecksum: varchar("source_checksum", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [uniqueIndex("content_quarantine_external_type_unique").on(table.externalId, table.postType)]);

export const academyRegistrations = mysqlTable("academy_registrations", {
  id: int("id").autoincrement().primaryKey(),
  reference: varchar("reference", { length: 24 }).notNull(),
  season: varchar("season", { length: 20 }).notNull().default("2026-2027"),
  childName: varchar("child_name", { length: 191 }).notNull(),
  childBirthYear: int("child_birth_year", { unsigned: true }).notNull(),
  preferredGroup: varchar("preferred_group", { length: 40 }).notNull(),
  guardianName: varchar("guardian_name", { length: 191 }).notNull(),
  guardianRelationship: varchar("guardian_relationship", { length: 80 }).notNull(),
  guardianEmail: varchar("guardian_email", { length: 191 }).notNull(),
  guardianPhone: varchar("guardian_phone", { length: 40 }).notNull(),
  address: varchar("address", { length: 255 }),
  notes: text("notes"),
  photoPreference: mysqlEnum("photo_preference", ["yes", "no"]).notNull().default("no"),
  privacyConsentAt: timestamp("privacy_consent_at").notNull(),
  status: mysqlEnum("status", ["new", "contacted", "completed", "archived"]).notNull().default("new"),
  emailStatus: mysqlEnum("email_status", ["pending", "sent", "failed"]).notNull().default("pending"),
  emailError: varchar("email_error", { length: 500 }),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => [
  uniqueIndex("academy_registrations_reference_unique").on(table.reference),
  index("academy_registrations_status_idx").on(table.status),
  index("academy_registrations_submitted_idx").on(table.submittedAt),
]);

export const siteSettings = mysqlTable("site_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("setting_key", { length: 120 }).notNull(),
  valueJson: json("value_json").notNull(),
  updatedByUserId: int("updated_by_user_id").references(() => adminUsers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => [uniqueIndex("site_settings_key_unique").on(table.settingKey)]);

export const contactMessages = mysqlTable("contact_messages", {
  id: int("id").autoincrement().primaryKey(),
  reference: varchar("reference", { length: 24 }).notNull(),
  senderName: varchar("sender_name", { length: 191 }).notNull(),
  senderEmail: varchar("sender_email", { length: 191 }).notNull(),
  senderPhone: varchar("sender_phone", { length: 40 }),
  subject: varchar("subject", { length: 191 }).notNull(),
  message: text("message").notNull(),
  privacyConsentAt: timestamp("privacy_consent_at").notNull(),
  status: mysqlEnum("status", ["new", "read", "replied", "archived"]).notNull().default("new"),
  emailStatus: mysqlEnum("email_status", ["pending", "sent", "failed"]).notNull().default("pending"),
  emailError: varchar("email_error", { length: 500 }),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => [
  uniqueIndex("contact_messages_reference_unique").on(table.reference),
  index("contact_messages_status_idx").on(table.status),
  index("contact_messages_submitted_idx").on(table.submittedAt),
]);
