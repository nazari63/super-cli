CREATE TABLE `user_context` (
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`forge_project_path` text,
	`last_wizard_id` text,
	`last_wizard_state` text
);
