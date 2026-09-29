CREATE TABLE `content_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`external_id` varchar(64) NOT NULL,
	`kind` enum('page','post') NOT NULL,
	`slug` varchar(191) NOT NULL,
	`title` text NOT NULL,
	`excerpt` text,
	`body_html` text NOT NULL,
	`author_name` varchar(191),
	`source_status` varchar(40) NOT NULL,
	`migration_status` enum('draft','quarantined') NOT NULL DEFAULT 'draft',
	`source_url` text,
	`source_checksum` varchar(64) NOT NULL,
	`featured_media_external_id` varchar(64),
	`seo_title` text,
	`seo_description` text,
	`published_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `content_entries_external_kind_unique` UNIQUE(`external_id`,`kind`),
	CONSTRAINT `content_entries_slug_kind_unique` UNIQUE(`slug`,`kind`)
);
--> statement-breakpoint
CREATE TABLE `content_entry_taxonomies` (
	`content_entry_id` int NOT NULL,
	`taxonomy_id` int NOT NULL,
	CONSTRAINT `content_entry_taxonomies_unique` UNIQUE(`content_entry_id`,`taxonomy_id`)
);
--> statement-breakpoint
CREATE TABLE `content_import_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source_fingerprint` varchar(64) NOT NULL,
	`mode` enum('dry_run','draft_import') NOT NULL,
	`status` enum('running','completed','failed') NOT NULL DEFAULT 'running',
	`report_json` json,
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	CONSTRAINT `content_import_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_quarantine` (
	`id` int AUTO_INCREMENT NOT NULL,
	`external_id` varchar(64) NOT NULL,
	`post_type` varchar(40) NOT NULL,
	`title` text,
	`source_url` text,
	`reason_json` json NOT NULL,
	`source_checksum` varchar(64) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_quarantine_id` PRIMARY KEY(`id`),
	CONSTRAINT `content_quarantine_external_type_unique` UNIQUE(`external_id`,`post_type`)
);
--> statement-breakpoint
CREATE TABLE `content_taxonomies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taxonomy` varchar(40) NOT NULL,
	`slug` varchar(191) NOT NULL,
	`name` varchar(191) NOT NULL,
	CONSTRAINT `content_taxonomies_id` PRIMARY KEY(`id`),
	CONSTRAINT `content_taxonomies_type_slug_unique` UNIQUE(`taxonomy`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `legacy_redirects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source_path` varchar(191) NOT NULL,
	`target_path` varchar(500) NOT NULL,
	`status_code` int NOT NULL DEFAULT 308,
	`source_external_id` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `legacy_redirects_id` PRIMARY KEY(`id`),
	CONSTRAINT `legacy_redirects_source_unique` UNIQUE(`source_path`)
);
--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`external_id` varchar(64) NOT NULL,
	`filename` varchar(255) NOT NULL,
	`source_url` text,
	`source_relative_path` varchar(500),
	`sha256` varchar(64),
	`mime_type` varchar(100),
	`byte_size` bigint unsigned,
	`width` int unsigned,
	`height` int unsigned,
	`alt_text` text,
	`caption` text,
	`credit` varchar(255),
	`derivative_manifest` json,
	`status` enum('ready','missing','quarantined') NOT NULL DEFAULT 'missing',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `media_assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_assets_external_id_unique` UNIQUE(`external_id`)
);
--> statement-breakpoint
ALTER TABLE `content_entry_taxonomies` ADD CONSTRAINT `content_entry_taxonomies_content_entry_id_content_entries_id_fk` FOREIGN KEY (`content_entry_id`) REFERENCES `content_entries`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_entry_taxonomies` ADD CONSTRAINT `content_entry_taxonomies_taxonomy_id_content_taxonomies_id_fk` FOREIGN KEY (`taxonomy_id`) REFERENCES `content_taxonomies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `content_entries_migration_status_idx` ON `content_entries` (`migration_status`);--> statement-breakpoint
CREATE INDEX `content_import_runs_fingerprint_idx` ON `content_import_runs` (`source_fingerprint`);--> statement-breakpoint
CREATE INDEX `media_assets_sha256_idx` ON `media_assets` (`sha256`);
