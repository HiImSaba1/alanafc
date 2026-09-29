CREATE TABLE `contact_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reference` varchar(24) NOT NULL,
	`sender_name` varchar(191) NOT NULL,
	`sender_email` varchar(191) NOT NULL,
	`sender_phone` varchar(40),
	`subject` varchar(191) NOT NULL,
	`message` text NOT NULL,
	`privacy_consent_at` timestamp NOT NULL,
	`status` enum('new','read','replied','archived') NOT NULL DEFAULT 'new',
	`email_status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`email_error` varchar(500),
	`submitted_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contact_messages_id` PRIMARY KEY(`id`),
	CONSTRAINT `contact_messages_reference_unique` UNIQUE(`reference`)
);
--> statement-breakpoint
CREATE INDEX `contact_messages_status_idx` ON `contact_messages` (`status`);--> statement-breakpoint
CREATE INDEX `contact_messages_submitted_idx` ON `contact_messages` (`submitted_at`);