CREATE TABLE `batches` (
	`id` text PRIMARY KEY NOT NULL,
	`bean_type_id` text NOT NULL,
	`seed_source_id` text,
	`character_id` text NOT NULL,
	`jar_label` text NOT NULL,
	`status` text NOT NULL,
	`soak_start_at` integer NOT NULL,
	`jar_start_at` integer NOT NULL,
	`target_harvest_at` integer NOT NULL,
	`actual_harvest_at` integer,
	`adjusted_soak_hours` real,
	`adjusted_grow_days` real,
	`notification_ids` text,
	`germination_pct` real,
	`user_rating` integer,
	`harvest_notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bean_type_id`) REFERENCES `bean_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`seed_source_id`) REFERENCES `seed_sources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bean_types` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`emoji` text NOT NULL,
	`soak_hours` real NOT NULL,
	`grow_days` real NOT NULL,
	`rinses_per_day` integer NOT NULL,
	`min_temp_f` integer NOT NULL,
	`max_temp_f` integer NOT NULL,
	`light_preference` text NOT NULL,
	`difficulty` text NOT NULL,
	`notes` text,
	`sulforaphane_rich` integer DEFAULT false,
	`seed_amount_grams` real DEFAULT 20
);
--> statement-breakpoint
CREATE TABLE `characters` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`personality` text NOT NULL,
	`voice_style` text NOT NULL,
	`water_attitude` text NOT NULL,
	`harvest_attitude` text NOT NULL,
	`secret_fear` text NOT NULL,
	`hidden_talent` text NOT NULL,
	`catchphrase` text NOT NULL,
	`rarity` text NOT NULL,
	`face_color` text NOT NULL,
	`eye_color` text NOT NULL,
	`eye_shape` text NOT NULL,
	`mouth` text NOT NULL,
	`accessory_emoji` text NOT NULL,
	`accessory_name` text NOT NULL,
	`traits_json` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `daily_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`batch_id` text NOT NULL,
	`log_type` text NOT NULL,
	`logged_at` integer NOT NULL,
	`room_temp_f` real,
	`rinse_water_temp` text,
	`observations` text,
	`photo_path` text,
	`growth_stage` text,
	`stage_notes` text,
	`gemma_analysis` text,
	FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `seed_adjustments` (
	`id` text PRIMARY KEY NOT NULL,
	`seed_source_id` text NOT NULL,
	`batch_count` integer DEFAULT 0 NOT NULL,
	`avg_germination_pct` real,
	`avg_actual_grow_days` real,
	`avg_room_temp_f` real,
	`default_grow_days` real NOT NULL,
	`grow_day_offset` real DEFAULT 0,
	`soak_hour_offset` real DEFAULT 0,
	`avg_user_rating` real,
	`last_gemma_insight` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`seed_source_id`) REFERENCES `seed_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `seed_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`bean_type_id` text NOT NULL,
	`supplier_name` text NOT NULL,
	`lot_number` text,
	`purchase_date` integer,
	`stock_grams` real DEFAULT 0,
	`reorder_url` text,
	`is_active` integer DEFAULT true,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`bean_type_id`) REFERENCES `bean_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stagger_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`cadence_days` integer NOT NULL,
	`bean_type_mix` text NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` integer NOT NULL
);
