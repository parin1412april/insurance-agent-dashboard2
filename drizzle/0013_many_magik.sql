CREATE TABLE `goal_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`selectedGoal` varchar(50) NOT NULL DEFAULT 'MDRT',
	`customFYP` int NOT NULL DEFAULT 2000000,
	`currentFYPInput` varchar(50) NOT NULL DEFAULT '',
	`avgCaseSize` int NOT NULL DEFAULT 80000,
	`prospectToAppt` int NOT NULL DEFAULT 50,
	`apptToPres` int NOT NULL DEFAULT 70,
	`presToClose` int NOT NULL DEFAULT 30,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `goal_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `goal_settings_userId_unique` UNIQUE(`userId`)
);
