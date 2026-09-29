ALTER TABLE `admin_users` ENGINE=InnoDB;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `site_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`setting_key` varchar(120) NOT NULL,
	`value_json` json NOT NULL,
	`updated_by_user_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_settings_key_unique` UNIQUE(`setting_key`),
	CONSTRAINT `site_settings_updated_by_user_id_admin_users_id_fk` FOREIGN KEY (`updated_by_user_id`) REFERENCES `admin_users`(`id`) ON DELETE set null ON UPDATE no action
) ENGINE=InnoDB;
