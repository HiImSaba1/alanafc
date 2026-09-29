ALTER TABLE `admin_users` MODIFY COLUMN `email` varchar(191);--> statement-breakpoint
ALTER TABLE `admin_users` ADD `username` varchar(120) NOT NULL;--> statement-breakpoint
ALTER TABLE `admin_users` ADD CONSTRAINT `admin_users_username_unique` UNIQUE(`username`);