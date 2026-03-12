CREATE TABLE `leads` (
`id` int AUTO_INCREMENT NOT NULL,
`userId` int NOT NULL,
`name` varchar(200) NOT NULL,
`phone` varchar(30) NOT NULL DEFAULT '',
`tags` varchar(1000) NOT NULL DEFAULT '',
`expectedPremium` int NOT NULL DEFAULT 0,
`columnStatus` enum('new_lead','contacted','fact_finding','follow_up','closed_won','closed_lost') NOT NULL DEFAULT 'new_lead',
`lastMovedAt` timestamp NOT NULL DEFAULT (now()),
`notes` text,
`profileImageUrl` text,
`sortOrder` int NOT NULL DEFAULT 0,
`createdAt` timestamp NOT NULL DEFAULT (now()),
`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
