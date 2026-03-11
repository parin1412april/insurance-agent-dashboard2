CREATE TABLE `agent_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`firstName` varchar(100) NOT NULL DEFAULT '',
	`lastName` varchar(100) NOT NULL DEFAULT '',
	`nickname` varchar(100) NOT NULL DEFAULT '',
	`agentCode` varchar(50) NOT NULL DEFAULT '',
	`phone` varchar(20) NOT NULL DEFAULT '',
	`status` varchar(50) NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `agent_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `kanban_cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`policyNumber` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`columnStatus` enum('waiting_memo','editing_memo','memo_sent','pending_review','approved') NOT NULL DEFAULT 'waiting_memo',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kanban_cards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whitelist_emails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(200) NOT NULL DEFAULT '',
	`note` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whitelist_emails_id` PRIMARY KEY(`id`),
	CONSTRAINT `whitelist_emails_email_unique` UNIQUE(`email`)
);
