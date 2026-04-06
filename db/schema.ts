/**
 * SproutPal — Drizzle ORM Schema
 * expo-sqlite + drizzle-orm
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// ─── Bean types (seed library) ───────────────────────────────────────────────
export const beanTypes = sqliteTable('bean_types', {
  id:               text('id').primaryKey(),
  name:             text('name').notNull(),
  emoji:            text('emoji').notNull(),
  soakHours:        real('soak_hours').notNull(),
  growDays:         real('grow_days').notNull(),
  rinsesPerDay:     integer('rinses_per_day').notNull(),
  minTempF:         integer('min_temp_f').notNull(),
  maxTempF:         integer('max_temp_f').notNull(),
  lightPreference:  text('light_preference').notNull(),
  difficulty:       text('difficulty').notNull(),
  notes:            text('notes'),
  sulforaphaneRich: integer('sulforaphane_rich', { mode: 'boolean' }).default(false),
  seedAmountGrams:  real('seed_amount_grams').default(20),
})

// ─── Seed sources (supplier tracking) ───────────────────────────────────────
export const seedSources = sqliteTable('seed_sources', {
  id:           text('id').primaryKey(),
  beanTypeId:   text('bean_type_id').notNull().references(() => beanTypes.id),
  supplierName: text('supplier_name').notNull(),
  lotNumber:    text('lot_number'),
  purchaseDate: integer('purchase_date'),
  stockGrams:   real('stock_grams').default(0),
  reorderUrl:   text('reorder_url'),
  isActive:     integer('is_active', { mode: 'boolean' }).default(true),
  createdAt:    integer('created_at').notNull(),
})

// ─── Characters ──────────────────────────────────────────────────────────────
export const characters = sqliteTable('characters', {
  id:              text('id').primaryKey(),
  name:            text('name').notNull(),
  personality:     text('personality').notNull(),
  voiceStyle:      text('voice_style').notNull(),
  waterAttitude:   text('water_attitude').notNull(),
  harvestAttitude: text('harvest_attitude').notNull(),
  secretFear:      text('secret_fear').notNull(),
  hiddenTalent:    text('hidden_talent').notNull(),
  catchphrase:     text('catchphrase').notNull(),
  rarity:          text('rarity').notNull(),
  faceColor:       text('face_color').notNull(),
  eyeColor:        text('eye_color').notNull(),
  eyeShape:        text('eye_shape').notNull(),
  mouth:           text('mouth').notNull(),
  accessoryEmoji:  text('accessory_emoji').notNull(),
  accessoryName:   text('accessory_name').notNull(),
  traitsJson:      text('traits_json').notNull(),
})

// ─── Containers (user's jar/tray inventory) ──────────────────────────────────
export const containers = sqliteTable('containers', {
  id:          text('id').primaryKey(),
  name:        text('name').notNull(),
  type:        text('type').notNull(),      // 'quart_jar' | 'half_gallon_jar' | 'pint_jar' | 'wide_mouth_quart' | 'sprouting_tray' | 'custom'
  capacityOz:  real('capacity_oz').notNull(),
  notes:       text('notes'),
  isActive:    integer('is_active', { mode: 'boolean' }).default(true),
  createdAt:   integer('created_at').notNull(),
})

// ─── Batches (core entity) ────────────────────────────────────────────────────
export const batches = sqliteTable('batches', {
  id:                text('id').primaryKey(),
  beanTypeId:        text('bean_type_id').notNull().references(() => beanTypes.id),
  seedSourceId:      text('seed_source_id').references(() => seedSources.id),
  characterId:       text('character_id').notNull().references(() => characters.id),
  jarLabel:          text('jar_label').notNull(),
  status:            text('status').notNull(),

  soakStartAt:       integer('soak_start_at').notNull(),
  jarStartAt:        integer('jar_start_at').notNull(),
  targetHarvestAt:   integer('target_harvest_at').notNull(),
  actualHarvestAt:   integer('actual_harvest_at'),

  adjustedSoakHours: real('adjusted_soak_hours'),
  adjustedGrowDays:  real('adjusted_grow_days'),

  notificationIds:   text('notification_ids'),

  germinationPct:    real('germination_pct'),
  userRating:        integer('user_rating'),
  harvestNotes:      text('harvest_notes'),

  containerId:        text('container_id').references(() => containers.id),
  seedAmountGrams:    real('seed_amount_grams'),
  containerFillPct:   real('container_fill_pct'),
  harvestYieldGrams:  real('harvest_yield_grams'),
  yieldRatio:         real('yield_ratio'),

  createdAt:         integer('created_at').notNull(),
  updatedAt:         integer('updated_at').notNull(),
})

// ─── Daily logs (rinse events) ───────────────────────────────────────────────
export const dailyLogs = sqliteTable('daily_logs', {
  id:             text('id').primaryKey(),
  batchId:        text('batch_id').notNull().references(() => batches.id),
  logType:        text('log_type').notNull(),

  loggedAt:       integer('logged_at').notNull(),

  roomTempF:      real('room_temp_f'),
  rinseWaterTemp: text('rinse_water_temp'),
  observations:   text('observations'),

  photoPath:      text('photo_path'),
  growthStage:    text('growth_stage'),
  stageNotes:     text('stage_notes'),

  gemmaAnalysis:  text('gemma_analysis'),
})

// ─── Seed adjustments (adaptive timing engine) ────────────────────────────────
export const seedAdjustments = sqliteTable('seed_adjustments', {
  id:                text('id').primaryKey(),
  seedSourceId:      text('seed_source_id').notNull().references(() => seedSources.id),
  batchCount:        integer('batch_count').notNull().default(0),
  avgGerminationPct: real('avg_germination_pct'),
  avgActualGrowDays: real('avg_actual_grow_days'),
  avgRoomTempF:      real('avg_room_temp_f'),
  defaultGrowDays:   real('default_grow_days').notNull(),
  growDayOffset:     real('grow_day_offset').default(0),
  soakHourOffset:    real('soak_hour_offset').default(0),
  avgUserRating:     real('avg_user_rating'),
  lastGemmaInsight:  text('last_gemma_insight'),
  updatedAt:         integer('updated_at').notNull(),
})

// ─── Stagger plans ────────────────────────────────────────────────────────────
export const staggerPlans = sqliteTable('stagger_plans', {
  id:          text('id').primaryKey(),
  cadenceDays: integer('cadence_days').notNull(),
  beanTypeMix: text('bean_type_mix').notNull(),
  isActive:    integer('is_active', { mode: 'boolean' }).default(true),
  createdAt:   integer('created_at').notNull(),
})

// ─── Genie memory (summarized conversation insights) ─────────────────────────
export const genieMemory = sqliteTable('genie_memory', {
  id:        text('id').primaryKey(),
  category:  text('category').notNull(),    // 'preference' | 'insight' | 'recommendation' | 'user_goal'
  summary:   text('summary').notNull(),
  createdAt: integer('created_at').notNull(),
  expiresAt: integer('expires_at'),
})

// ─── Genie messages (recent chat for display) ────────────────────────────────
export const genieMessages = sqliteTable('genie_messages', {
  id:        text('id').primaryKey(),
  role:      text('role').notNull(),         // 'user' | 'genie'
  content:   text('content').notNull(),
  context:   text('context'),                // JSON: screen, batchId, data injected
  createdAt: integer('created_at').notNull(),
})
