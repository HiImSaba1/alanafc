ALTER TABLE `legacy_redirects` MODIFY COLUMN `source_path` varchar(191) NOT NULL;--> statement-breakpoint
ALTER TABLE `content_entries` ADD `publication_status` enum('draft','published','scheduled','archived') DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE `content_entries` ADD `gallery_media_external_ids` json;--> statement-breakpoint
ALTER TABLE `content_entries` ADD `scheduled_for` timestamp;--> statement-breakpoint
CREATE INDEX `content_entries_publication_status_idx` ON `content_entries` (`publication_status`);--> statement-breakpoint
CREATE INDEX `content_entries_scheduled_for_idx` ON `content_entries` (`scheduled_for`);