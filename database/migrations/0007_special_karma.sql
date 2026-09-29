CREATE TABLE `content_revisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`content_entry_id` int NOT NULL,
	`editor_user_id` int,
	`revision_number` int NOT NULL,
	`snapshot` json NOT NULL,
	`change_summary` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_revisions_id` PRIMARY KEY(`id`),
	CONSTRAINT `content_revisions_entry_number_unique` UNIQUE(`content_entry_id`,`revision_number`)
);
--> statement-breakpoint
ALTER TABLE `content_revisions` ADD CONSTRAINT `content_revisions_content_entry_id_content_entries_id_fk` FOREIGN KEY (`content_entry_id`) REFERENCES `content_entries`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_revisions` ADD CONSTRAINT `content_revisions_editor_user_id_admin_users_id_fk` FOREIGN KEY (`editor_user_id`) REFERENCES `admin_users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `content_revisions_entry_created_idx` ON `content_revisions` (`content_entry_id`,`created_at`);