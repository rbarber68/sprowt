CREATE TABLE `containers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`capacity_oz` real NOT NULL,
	`notes` text,
	`is_active` integer DEFAULT true,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `genie_memory` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`summary` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer
);
--> statement-breakpoint
CREATE TABLE `genie_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`context` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `batches` ADD `container_id` text REFERENCES containers(id);--> statement-breakpoint
ALTER TABLE `batches` ADD `seed_amount_grams` real;--> statement-breakpoint
ALTER TABLE `batches` ADD `container_fill_pct` real;--> statement-breakpoint
ALTER TABLE `batches` ADD `harvest_yield_grams` real;--> statement-breakpoint
ALTER TABLE `batches` ADD `yield_ratio` real;