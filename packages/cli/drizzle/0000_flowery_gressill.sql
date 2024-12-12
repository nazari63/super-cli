CREATE TABLE `deployment_intents` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`artifact_local_path` text NOT NULL,
	`network` text NOT NULL,
	`chain_ids` text NOT NULL,
	`creation_params` text NOT NULL,
	`initialization_params` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `metadata` (
	`id` text PRIMARY KEY NOT NULL,
	`version` text NOT NULL
);
