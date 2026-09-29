CREATE TABLE `academy_registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reference` varchar(24) NOT NULL,
	`season` varchar(20) NOT NULL DEFAULT '2026-2027',
	`child_name` varchar(191) NOT NULL,
	`child_birth_year` int unsigned NOT NULL,
	`preferred_group` varchar(40) NOT NULL,
	`guardian_name` varchar(191) NOT NULL,
	`guardian_relationship` varchar(80) NOT NULL,
	`guardian_email` varchar(191) NOT NULL,
	`guardian_phone` varchar(40) NOT NULL,
	`address` varchar(255),
	`notes` text,
	`photo_preference` enum('yes','no') NOT NULL DEFAULT 'no',
	`privacy_consent_at` timestamp NOT NULL,
	`status` enum('new','contacted','completed','archived') NOT NULL DEFAULT 'new',
	`email_status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`email_error` varchar(500),
	`submitted_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `academy_registrations_id` PRIMARY KEY(`id`),
	CONSTRAINT `academy_registrations_reference_unique` UNIQUE(`reference`)
);
--> statement-breakpoint
CREATE INDEX `academy_registrations_status_idx` ON `academy_registrations` (`status`);--> statement-breakpoint
CREATE INDEX `academy_registrations_submitted_idx` ON `academy_registrations` (`submitted_at`);