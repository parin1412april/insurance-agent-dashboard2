CREATE TABLE `event_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`url` varchar(1000) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `event_images_id` PRIMARY KEY(`id`)
);
