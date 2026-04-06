# Yield Tracking & Sprout Genie Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add container inventory, per-batch yield tracking, performance analytics, and a unified Sprout Genie AI chat layer that orchestrates all notifications and coaching in a game-show style.

**Architecture:** Three layers built bottom-up: (1) data layer — new tables + schema migration, (2) feature modules — container CRUD, Genie prompt engine, performance queries, (3) UI — container picker, yield harvest fields, Genie chat sheet, Performance tab. The Genie replaces scattered Gemma calls with a single system-prompt-driven AI that knows all user data.

**Tech Stack:** Drizzle ORM (expo-sqlite), Google AI Studio (gemini-2.0-flash), Expo Router, NativeWind v4, expo-notifications.

---

## File Map

**New files:**
- `db/schema.ts` — add `containers`, `genieMemory`, `genieMessages` tables + new batch columns
- `lib/containers.ts` — container CRUD + default seeding
- `lib/genie.ts` — Genie system prompt builder, context snapshots, memory management
- `lib/performance.ts` — yield ratio queries, combo stats, trend computation
- `components/ContainerPicker.tsx` — container selection dropdown + inline add
- `components/GenieChat.tsx` — bottom sheet chat UI
- `components/PerformanceTab.tsx` — stats cards + combo table

**Modified files:**
- `lib/seed.ts` — rename to `seedDefaultsIfNeeded`, add container seeding
- `lib/kvstore.ts` — add `COACH_INTENSITY` key
- `lib/gemma.ts` — route notification generation through Genie prompt
- `lib/notifications.ts` — use Genie for notification content
- `data/characters.ts` — add Genie system prompt (replaces per-character prompt for chat)
- `app/batch/new.tsx` — Step 3: add seed amount input, container picker, yield hint
- `app/batch/[id].tsx` — harvest flow: add yield weight, fill %, Genie entry from bubble
- `app/(tabs)/history.tsx` — add Performance tab
- `app/(tabs)/index.tsx` — GemmaBubble opens Genie chat
- `app/settings.tsx` — add coach intensity selector, container management
- `components/GemmaBubble.tsx` — add `onPress` prop for opening chat

---

## Task 1: Schema — New Tables and Batch Columns

**Files:**
- Modify: `db/schema.ts`

- [ ] **Step 1: Add `containers` table to schema**

Add after the `characters` table in `db/schema.ts`:

```typescript
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
```

- [ ] **Step 2: Add yield columns to `batches` table**

Add these columns to the existing `batches` table definition, after `harvestNotes`:

```typescript
  containerId:        text('container_id').references(() => containers.id),
  seedAmountGrams:    real('seed_amount_grams'),
  containerFillPct:   real('container_fill_pct'),
  harvestYieldGrams:  real('harvest_yield_grams'),
  yieldRatio:         real('yield_ratio'),
```

- [ ] **Step 3: Add `genieMemory` table**

Add after `staggerPlans`:

```typescript
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
```

- [ ] **Step 4: Generate migration**

Run: `npx drizzle-kit generate`
Expected: New migration file in `db/migrations/` with CREATE TABLE for containers, genie_memory, genie_messages, and ALTER TABLE for batches.

- [ ] **Step 5: Commit**

```bash
git add db/schema.ts db/migrations/
git commit -m "feat: add containers, genie tables, and batch yield columns to schema"
```

---

## Task 2: Container Seeding and CRUD

**Files:**
- Create: `lib/containers.ts`
- Modify: `lib/seed.ts`

- [ ] **Step 1: Create `lib/containers.ts`**

```typescript
/**
 * SproutPal — Container Inventory
 * CRUD + default container seeding
 */

import { v4 as uuidv4 } from 'uuid'
import { db } from '@/db/client'
import { containers } from '@/db/schema'
import { eq, count } from 'drizzle-orm'

export const DEFAULT_CONTAINERS = [
  { name: 'Quart Mason Jar',  type: 'quart_jar',        capacityOz: 32 },
  { name: 'Half-Gallon Jar',  type: 'half_gallon_jar',  capacityOz: 64 },
  { name: 'Pint Mason Jar',   type: 'pint_jar',         capacityOz: 16 },
  { name: 'Wide-Mouth Quart', type: 'wide_mouth_quart', capacityOz: 32 },
  { name: 'Sprouting Tray',   type: 'sprouting_tray',   capacityOz: 0  },
] as const

export async function seedContainersIfNeeded() {
  const [{ value }] = await db.select({ value: count() }).from(containers)
  if (value > 0) return

  const now = Date.now()
  for (const c of DEFAULT_CONTAINERS) {
    await db.insert(containers).values({
      id: uuidv4(),
      name: c.name,
      type: c.type,
      capacityOz: c.capacityOz,
      createdAt: now,
    })
  }
  console.log(`Seeded ${DEFAULT_CONTAINERS.length} default containers`)
}

export async function getAllContainers() {
  return db.select().from(containers)
    .where(eq(containers.isActive, true))
    .orderBy(containers.name)
}

export async function addContainer(name: string, type: string, capacityOz: number, notes?: string) {
  const id = uuidv4()
  await db.insert(containers).values({
    id,
    name,
    type,
    capacityOz,
    notes: notes ?? null,
    createdAt: Date.now(),
  })
  return id
}

export async function deleteContainer(id: string) {
  await db.update(containers)
    .set({ isActive: false })
    .where(eq(containers.id, id))
}
```

- [ ] **Step 2: Update `lib/seed.ts` to seed containers**

Replace the entire file:

```typescript
/**
 * SproutPal — Database Seeder
 * Seeds bean types and default containers on first launch
 */

import { db } from '@/db/client'
import { beanTypes } from '@/db/schema'
import { SPROUT_TYPES } from '@/data/sproutTypes'
import { seedContainersIfNeeded } from './containers'
import { count } from 'drizzle-orm'

export async function seedDefaultsIfNeeded() {
  // Seed bean types
  const [{ value }] = await db.select({ value: count() }).from(beanTypes)
  if (value === 0) {
    for (const sprout of SPROUT_TYPES) {
      await db.insert(beanTypes).values({
        id: sprout.id,
        name: sprout.name,
        emoji: sprout.emoji,
        soakHours: sprout.soakHours,
        growDays: sprout.growDays,
        rinsesPerDay: sprout.rinsesPerDay,
        minTempF: sprout.minTempF,
        maxTempF: sprout.maxTempF,
        lightPreference: sprout.lightPreference,
        difficulty: sprout.difficulty,
        notes: sprout.notes,
        sulforaphaneRich: sprout.sulforaphaneRich,
        seedAmountGrams: sprout.seedAmountGrams,
      })
    }
    console.log(`Seeded ${SPROUT_TYPES.length} bean types`)
  }

  // Seed default containers
  await seedContainersIfNeeded()
}
```

- [ ] **Step 3: Update `components/DatabaseProvider.tsx` to use new seed function**

Change the import from:
```typescript
import { seedBeanTypesIfNeeded } from '@/lib/seed'
```
to:
```typescript
import { seedDefaultsIfNeeded } from '@/lib/seed'
```

And change the call from `seedBeanTypesIfNeeded()` to `seedDefaultsIfNeeded()`.

- [ ] **Step 4: Commit**

```bash
git add lib/containers.ts lib/seed.ts components/DatabaseProvider.tsx
git commit -m "feat: add container inventory with defaults and CRUD"
```

---

## Task 3: KV Store Update + Performance Query Module

**Files:**
- Modify: `lib/kvstore.ts`
- Create: `lib/performance.ts`

- [ ] **Step 1: Add `COACH_INTENSITY` to KV keys**

In `lib/kvstore.ts`, add to `KV_KEYS`:

```typescript
export const KV_KEYS = {
  VIEW_MODE: 'viewMode',
  NOTIFICATION_VOICE: 'notificationVoice',
  RINSE_TIME_1: 'rinseTime1',
  RINSE_TIME_2: 'rinseTime2',
  RINSE_TIME_3: 'rinseTime3',
  GEMMA_MODE: 'gemmaMode',
  ONBOARDING_COMPLETE: 'onboardingComplete',
  GOOGLE_AI_API_KEY: 'googleAiApiKey',
  COACH_INTENSITY: 'coachIntensity',
} as const
```

- [ ] **Step 2: Create `lib/performance.ts`**

```typescript
/**
 * SproutPal — Performance Analytics
 * Yield ratio queries, combo stats, trend computation
 */

import { db } from '@/db/client'
import { batches, beanTypes, containers } from '@/db/schema'
import { eq, and, desc, isNotNull, sql } from 'drizzle-orm'

export interface ComboStats {
  beanTypeId: string
  beanName: string
  beanEmoji: string
  containerId: string
  containerName: string
  avgYieldRatio: number
  avgFillPct: number
  avgRating: number
  batchCount: number
}

export interface PerformanceSummary {
  bestCombo: ComboStats | null
  mostConsistent: ComboStats | null
  totalTrackedBatches: number
  combos: ComboStats[]
}

export async function getPerformanceSummary(): Promise<PerformanceSummary> {
  // Get all harvested batches with yield data
  const rows = await db.select({
    beanTypeId: batches.beanTypeId,
    beanName: beanTypes.name,
    beanEmoji: beanTypes.emoji,
    containerId: batches.containerId,
    containerName: containers.name,
    yieldRatio: batches.yieldRatio,
    fillPct: batches.containerFillPct,
    rating: batches.userRating,
  })
    .from(batches)
    .innerJoin(beanTypes, eq(batches.beanTypeId, beanTypes.id))
    .innerJoin(containers, eq(batches.containerId, containers.id))
    .where(and(
      eq(batches.status, 'harvested'),
      isNotNull(batches.yieldRatio),
    ))
    .orderBy(desc(batches.actualHarvestAt))

  if (rows.length === 0) {
    return { bestCombo: null, mostConsistent: null, totalTrackedBatches: 0, combos: [] }
  }

  // Group by sprout+container combo
  const comboMap = new Map<string, {
    beanTypeId: string; beanName: string; beanEmoji: string;
    containerId: string; containerName: string;
    yields: number[]; fills: number[]; ratings: number[];
  }>()

  for (const row of rows) {
    if (!row.containerId || !row.yieldRatio) continue
    const key = `${row.beanTypeId}::${row.containerId}`
    if (!comboMap.has(key)) {
      comboMap.set(key, {
        beanTypeId: row.beanTypeId,
        beanName: row.beanName,
        beanEmoji: row.beanEmoji,
        containerId: row.containerId!,
        containerName: row.containerName,
        yields: [], fills: [], ratings: [],
      })
    }
    const combo = comboMap.get(key)!
    combo.yields.push(row.yieldRatio)
    if (row.fillPct) combo.fills.push(row.fillPct)
    if (row.rating) combo.ratings.push(row.rating)
  }

  const combos: ComboStats[] = Array.from(comboMap.values()).map(c => ({
    beanTypeId: c.beanTypeId,
    beanName: c.beanName,
    beanEmoji: c.beanEmoji,
    containerId: c.containerId,
    containerName: c.containerName,
    avgYieldRatio: c.yields.reduce((a, b) => a + b, 0) / c.yields.length,
    avgFillPct: c.fills.length > 0 ? c.fills.reduce((a, b) => a + b, 0) / c.fills.length : 0,
    avgRating: c.ratings.length > 0 ? c.ratings.reduce((a, b) => a + b, 0) / c.ratings.length : 0,
    batchCount: c.yields.length,
  }))

  // Sort by yield ratio descending
  combos.sort((a, b) => b.avgYieldRatio - a.avgYieldRatio)

  // Most consistent = lowest std dev in yield ratio (min 2 batches)
  let mostConsistent: ComboStats | null = null
  let lowestVariance = Infinity
  for (const c of Array.from(comboMap.values())) {
    if (c.yields.length < 2) continue
    const mean = c.yields.reduce((a, b) => a + b, 0) / c.yields.length
    const variance = c.yields.reduce((sum, y) => sum + (y - mean) ** 2, 0) / c.yields.length
    if (variance < lowestVariance) {
      lowestVariance = variance
      mostConsistent = combos.find(x => x.beanTypeId === c.beanTypeId && x.containerId === c.containerId) ?? null
    }
  }

  return {
    bestCombo: combos[0] ?? null,
    mostConsistent,
    totalTrackedBatches: rows.length,
    combos,
  }
}

export async function getComboHistory(beanTypeId: string, containerId: string) {
  return db.select().from(batches)
    .where(and(
      eq(batches.beanTypeId, beanTypeId),
      eq(batches.containerId, containerId),
      eq(batches.status, 'harvested'),
    ))
    .orderBy(desc(batches.actualHarvestAt))
}

export async function getYieldHint(beanTypeId: string, containerId: string): Promise<string | null> {
  const rows = await db.select({ yieldRatio: batches.yieldRatio })
    .from(batches)
    .where(and(
      eq(batches.beanTypeId, beanTypeId),
      eq(batches.containerId, containerId),
      eq(batches.status, 'harvested'),
      isNotNull(batches.yieldRatio),
    ))

  if (rows.length < 2) return null
  const avg = rows.reduce((sum, r) => sum + (r.yieldRatio ?? 0), 0) / rows.length
  return `Your avg yield: ${avg.toFixed(1)}x (${rows.length} batches)`
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/kvstore.ts lib/performance.ts
git commit -m "feat: add performance analytics module and coach intensity KV key"
```

---

## Task 4: Genie Core — System Prompt, Context Builder, Memory

**Files:**
- Create: `lib/genie.ts`

- [ ] **Step 1: Create `lib/genie.ts`**

```typescript
/**
 * SproutPal — Sprout Genie
 * Central AI layer: system prompt, context injection, memory management
 */

import { v4 as uuidv4 } from 'uuid'
import { db } from '@/db/client'
import { batches, beanTypes, characters, containers, genieMemory, genieMessages } from '@/db/schema'
import { eq, and, ne, desc, isNotNull } from 'drizzle-orm'
import { getKVStore, KV_KEYS } from './kvstore'
import { callGemma } from './gemma'
import { getPerformanceSummary } from './performance'

const GENIE_SYSTEM_PROMPT_FUN = `You are the Sprout Genie — the enthusiastic, all-knowing host of SproutPal's "The Great Sprout-Off!"

Every batch is a contestant. Every rinse is a challenge round. Every harvest is a finale with dramatic reveals. You channel the personality of the user's sprout characters — they're your contestants and you LOVE them. Use their catchphrases, reference their fears, celebrate their talents. Be funny, dramatic, and wildly encouraging. Think part Bob Barker, part David Attenborough, part over-caffeinated gardening aunt.

You have FULL ACCESS to the user's data: active batches, archived batches, yield data, container performance, rinse logs, and conversation memory.

Rules:
- Always reference actual data when giving advice. Never make up numbers.
- Treat every interaction like a live show moment. Characters are real contestants.
- Keep notifications under 40 words. Keep chat responses under 100 words unless the user asks for detail.
- When asked "what should I grow?" — check history, find gaps, recommend based on what performs well.
- A discarded batch is a "learning round" — never negative.
- Use game show language: "contestants", "rounds", "challenges", "the arena", "season recap".`

const GENIE_SYSTEM_PROMPT_BUSINESS = `You are the Sprout Genie, a precise sprouting consultant inside the SproutPal app.

You have full access to the user's batch history, yield data, container performance, and active batches.

Rules:
- Lead with the number, then the recommendation.
- 2-3 sentences maximum unless the user asks for detail.
- No personality, no game show, no humor. Just actionable data-driven insights.
- Reference actual yield ratios, fill percentages, and batch counts from the user's data.`

export function getGenieSystemPrompt(): string {
  const mode = getKVStore(KV_KEYS.VIEW_MODE) ?? 'fun'
  return mode === 'business' ? GENIE_SYSTEM_PROMPT_BUSINESS : GENIE_SYSTEM_PROMPT_FUN
}

/**
 * Build a data context snapshot to inject into chat messages.
 * Kept under ~800 tokens total.
 */
export async function buildContextSnapshot(screenContext?: {
  screen: string
  batchId?: string
}): Promise<string> {
  const parts: string[] = []

  // Active batches summary (~200 tokens)
  const active = await db.select({
    jarLabel: batches.jarLabel,
    status: batches.status,
    beanName: beanTypes.name,
    charName: characters.name,
    containerName: containers.name,
    soakStartAt: batches.soakStartAt,
    targetHarvestAt: batches.targetHarvestAt,
  })
    .from(batches)
    .innerJoin(beanTypes, eq(batches.beanTypeId, beanTypes.id))
    .innerJoin(characters, eq(batches.characterId, characters.id))
    .leftJoin(containers, eq(batches.containerId, containers.id))
    .where(and(ne(batches.status, 'harvested'), ne(batches.status, 'discarded')))
    .limit(10)

  if (active.length > 0) {
    parts.push('ACTIVE BATCHES:')
    for (const b of active) {
      const day = Math.floor((Date.now() - b.soakStartAt) / 86400000)
      parts.push(`- ${b.charName} (${b.beanName}) in ${b.containerName ?? 'unknown jar'}, day ${day}, status: ${b.status}`)
    }
  }

  // Current batch detail if on batch screen (~150 tokens)
  if (screenContext?.batchId) {
    const [detail] = await db.select().from(batches)
      .innerJoin(beanTypes, eq(batches.beanTypeId, beanTypes.id))
      .innerJoin(characters, eq(batches.characterId, characters.id))
      .leftJoin(containers, eq(batches.containerId, containers.id))
      .where(eq(batches.id, screenContext.batchId))

    if (detail) {
      const b = detail.batches
      parts.push(`\nCURRENT BATCH: ${detail.characters.name} — ${detail.bean_types.name} in ${detail.containers?.name ?? 'unknown'}, ${b.seedAmountGrams ?? '?'}g seed, day ${Math.floor((Date.now() - b.soakStartAt) / 86400000)}, status: ${b.status}`)
      if (b.yieldRatio) parts.push(`Yield: ${b.yieldRatio.toFixed(1)}x, fill: ${b.containerFillPct}%`)
    }
  }

  // Performance stats (~150 tokens)
  if (screenContext?.screen === 'performance' || !screenContext) {
    const perf = await getPerformanceSummary()
    if (perf.totalTrackedBatches > 0) {
      parts.push(`\nPERFORMANCE: ${perf.totalTrackedBatches} tracked batches.`)
      if (perf.bestCombo) {
        parts.push(`Best combo: ${perf.bestCombo.beanName} in ${perf.bestCombo.containerName} = ${perf.bestCombo.avgYieldRatio.toFixed(1)}x avg (${perf.bestCombo.batchCount} batches)`)
      }
      // Top 3 combos
      for (const c of perf.combos.slice(0, 3)) {
        parts.push(`- ${c.beanName} + ${c.containerName}: ${c.avgYieldRatio.toFixed(1)}x, ${c.avgRating.toFixed(1)} stars (${c.batchCount})`)
      }
    }
  }

  // Conversation memory (~200 tokens)
  const memories = await db.select().from(genieMemory)
    .orderBy(desc(genieMemory.createdAt))
    .limit(5)

  if (memories.length > 0) {
    parts.push('\nMEMORY (past conversations):')
    for (const m of memories) {
      parts.push(`- [${m.category}] ${m.summary}`)
    }
  }

  return parts.join('\n')
}

/**
 * Send a message to the Genie and get a response.
 */
export async function chatWithGenie(
  userMessage: string,
  screenContext?: { screen: string; batchId?: string },
): Promise<string> {
  const systemPrompt = getGenieSystemPrompt()
  const context = await buildContextSnapshot(screenContext)
  const fullUserMessage = `${context}\n\n---\nUser: ${userMessage}`

  // Save user message
  await db.insert(genieMessages).values({
    id: uuidv4(),
    role: 'user',
    content: userMessage,
    context: screenContext ? JSON.stringify(screenContext) : null,
    createdAt: Date.now(),
  })

  // Call Gemma
  const response = await callGemma(systemPrompt, fullUserMessage, 200)
  const genieResponse = response || "The Genie is taking a quick nap. Try again in a moment!"

  // Save genie response
  await db.insert(genieMessages).values({
    id: uuidv4(),
    role: 'genie',
    content: genieResponse,
    context: screenContext ? JSON.stringify(screenContext) : null,
    createdAt: Date.now(),
  })

  return genieResponse
}

/**
 * Get recent chat messages for display.
 */
export async function getRecentMessages(limit: number = 50) {
  return db.select().from(genieMessages)
    .orderBy(desc(genieMessages.createdAt))
    .limit(limit)
}

/**
 * Summarize the current chat session into memory, then prune old messages.
 */
export async function summarizeAndPrune() {
  const recent = await db.select().from(genieMessages)
    .orderBy(desc(genieMessages.createdAt))
    .limit(10)

  if (recent.length < 4) return // not enough to summarize

  const conversation = recent
    .reverse()
    .map(m => `${m.role}: ${m.content}`)
    .join('\n')

  const summaryPrompt = `Summarize the key takeaways from this conversation in 1-2 short bullet points. Focus on user preferences, goals, or advice given. Be specific.\n\n${conversation}`

  const summary = await callGemma(
    'You are a summarization assistant. Output only bullet points.',
    summaryPrompt,
    100,
  )

  if (summary) {
    await db.insert(genieMemory).values({
      id: uuidv4(),
      category: 'insight',
      summary,
      createdAt: Date.now(),
    })
  }

  // Prune messages older than 7 days
  const cutoff = Date.now() - 7 * 86400000
  await db.delete(genieMessages).where(
    sql`${genieMessages.createdAt} < ${cutoff}`
  )
}

/**
 * Generate a notification message through the Genie.
 */
export async function genieNotification(
  type: 'rinse' | 'harvest' | 'morning' | 'tip' | 'risk',
  batchContext: string,
): Promise<string> {
  const systemPrompt = getGenieSystemPrompt()
  const prompts: Record<string, string> = {
    rinse: `Generate a rinse reminder notification (under 40 words) for: ${batchContext}`,
    harvest: `Generate a harvest alert notification (under 40 words) for: ${batchContext}`,
    morning: `Generate a morning farm briefing notification (under 60 words). Active batches: ${batchContext}`,
    tip: `Generate a contextual growing tip notification (under 40 words) for: ${batchContext}`,
    risk: `Generate an urgent risk alert notification (under 40 words) for: ${batchContext}`,
  }

  return callGemma(systemPrompt, prompts[type] ?? prompts.tip, 60)
}
```

- [ ] **Step 2: Add missing `sql` import and `delete` usage check**

The `sql` template tag is imported from `drizzle-orm`. Verify the import at the top of `lib/genie.ts` includes it:
```typescript
import { eq, and, ne, desc, isNotNull, sql } from 'drizzle-orm'
```

- [ ] **Step 3: Commit**

```bash
git add lib/genie.ts
git commit -m "feat: add Sprout Genie core — system prompt, context builder, memory, chat"
```

---

## Task 5: ContainerPicker Component

**Files:**
- Create: `components/ContainerPicker.tsx`

- [ ] **Step 1: Create `components/ContainerPicker.tsx`**

```typescript
/**
 * SproutPal — Container Picker
 * Dropdown of user containers + inline "Add new" form
 */

import { View, Text, Pressable, TextInput, ScrollView } from 'react-native'
import { useState, useEffect } from 'react'
import { getAllContainers, addContainer } from '@/lib/containers'
import type { containers } from '@/db/schema'

interface ContainerPickerProps {
  selectedId: string | null
  onSelect: (id: string | null) => void
  yieldHint?: string | null
}

const CONTAINER_TYPES = [
  { value: 'quart_jar', label: 'Quart jar' },
  { value: 'half_gallon_jar', label: 'Half-gallon jar' },
  { value: 'pint_jar', label: 'Pint jar' },
  { value: 'wide_mouth_quart', label: 'Wide-mouth quart' },
  { value: 'sprouting_tray', label: 'Sprouting tray' },
  { value: 'custom', label: 'Custom' },
]

export function ContainerPicker({ selectedId, onSelect, yieldHint }: ContainerPickerProps) {
  const [containerList, setContainerList] = useState<(typeof containers.$inferSelect)[]>([])
  const [showAddNew, setShowAddNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('quart_jar')
  const [newCapacity, setNewCapacity] = useState('32')

  useEffect(() => {
    getAllContainers().then(setContainerList)
  }, [])

  const handleAddNew = async () => {
    if (!newName.trim()) return
    const id = await addContainer(newName.trim(), newType, parseFloat(newCapacity) || 32)
    onSelect(id)
    setShowAddNew(false)
    setNewName('')
    getAllContainers().then(setContainerList)
  }

  return (
    <View>
      <Text className="text-sm font-medium text-gray-500 mb-2">Container</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
        {containerList.map(c => (
          <Pressable
            key={c.id}
            className={`mr-2 px-3 py-2 rounded-chip border ${
              selectedId === c.id ? 'bg-sprout-600 border-sprout-600' : 'bg-white border-gray-200'
            }`}
            onPress={() => onSelect(selectedId === c.id ? null : c.id)}
          >
            <Text className={selectedId === c.id ? 'text-white text-sm' : 'text-gray-600 text-sm'}>
              {c.name}
            </Text>
            <Text className={selectedId === c.id ? 'text-white/70 text-xs' : 'text-gray-400 text-xs'}>
              {c.capacityOz > 0 ? `${c.capacityOz}oz` : 'flat'}
            </Text>
          </Pressable>
        ))}
        <Pressable
          className="px-3 py-2 rounded-chip border border-dashed border-sprout-400"
          onPress={() => setShowAddNew(!showAddNew)}
        >
          <Text className="text-sprout-600 text-sm">+ New</Text>
        </Pressable>
      </ScrollView>

      {yieldHint && (
        <View className="bg-sprout-50 rounded-card p-2 mb-2">
          <Text className="text-xs text-sprout-600">{yieldHint}</Text>
        </View>
      )}

      {showAddNew && (
        <View className="bg-gray-50 rounded-card p-3 mb-2">
          <TextInput
            className="bg-white rounded-card px-3 py-2 text-sm mb-2 border border-gray-200"
            placeholder="Container name"
            value={newName}
            onChangeText={setNewName}
            placeholderTextColor="#999"
          />
          <View className="flex-row gap-2 mb-2">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {CONTAINER_TYPES.map(t => (
                <Pressable
                  key={t.value}
                  className={`mr-1 px-2 py-1 rounded border ${
                    newType === t.value ? 'bg-sprout-100 border-sprout-400' : 'border-gray-200'
                  }`}
                  onPress={() => setNewType(t.value)}
                >
                  <Text className="text-xs">{t.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          <View className="flex-row gap-2 items-center">
            <TextInput
              className="bg-white rounded-card px-3 py-2 text-sm border border-gray-200 w-20"
              placeholder="oz"
              value={newCapacity}
              onChangeText={setNewCapacity}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            <Text className="text-xs text-gray-400">oz capacity</Text>
            <Pressable className="ml-auto bg-sprout-600 px-4 py-2 rounded-chip" onPress={handleAddNew}>
              <Text className="text-white text-sm font-medium">Add</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ContainerPicker.tsx
git commit -m "feat: add ContainerPicker component with inline add-new form"
```

---

## Task 6: GenieChat Component

**Files:**
- Create: `components/GenieChat.tsx`
- Modify: `components/GemmaBubble.tsx`

- [ ] **Step 1: Create `components/GenieChat.tsx`**

```typescript
/**
 * SproutPal — Genie Chat
 * Bottom sheet chat UI with context-aware suggested questions
 */

import { View, Text, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useState, useEffect, useRef } from 'react'
import { chatWithGenie, getRecentMessages, summarizeAndPrune } from '@/lib/genie'

interface GenieChatProps {
  visible: boolean
  onClose: () => void
  screenContext?: { screen: string; batchId?: string }
}

const SUGGESTED_QUESTIONS: Record<string, string[]> = {
  farm: ["How's my farm doing?", "What should I start next?", "Give me the season recap!"],
  batch: ["Tips for this batch?", "Compare to my history", "What's my contestant's chances?"],
  performance: ["What's my best setup?", "How can I improve?", "Rank my contestants!"],
  default: ["What should I grow?", "Give me a tip!", "How's my farm?"],
}

interface ChatMessage {
  id: string
  role: string
  content: string
  createdAt: number
}

export function GenieChat({ visible, onClose, screenContext }: GenieChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  const suggestions = SUGGESTED_QUESTIONS[screenContext?.screen ?? 'default'] ?? SUGGESTED_QUESTIONS.default

  useEffect(() => {
    if (visible) {
      getRecentMessages(30).then(msgs => {
        setMessages(msgs.reverse())
      })
    }
  }, [visible])

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
  }, [messages.length])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      createdAt: Date.now(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await chatWithGenie(text.trim(), screenContext)
      const genieMsg: ChatMessage = {
        id: `genie-${Date.now()}`,
        role: 'genie',
        content: response,
        createdAt: Date.now(),
      }
      setMessages(prev => [...prev, genieMsg])
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'genie',
        content: "The Genie got stage fright! Try again in a moment.",
        createdAt: Date.now(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleClose = async () => {
    // Summarize session to memory on close
    try { await summarizeAndPrune() } catch {}
    onClose()
  }

  if (!visible) return null

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="absolute inset-0 bg-black/40 justify-end"
    >
      <View className="bg-white rounded-t-3xl max-h-[80%] min-h-[50%]">
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-100">
          <View className="flex-row items-center">
            <Text className="text-xl mr-2">{'\ud83e\uddde'}</Text>
            <Text className="text-lg font-bold text-sprout-800">Sprout Genie</Text>
          </View>
          <Pressable onPress={handleClose} className="p-2">
            <Text className="text-xl text-gray-400">{'\u2715'}</Text>
          </Pressable>
        </View>

        {/* Messages */}
        <ScrollView ref={scrollRef} className="flex-1 px-4 py-2">
          {messages.length === 0 && (
            <View className="items-center py-8">
              <Text className="text-4xl mb-2">{'\ud83e\uddde'}</Text>
              <Text className="text-sprout-600 font-medium text-center">
                Welcome to The Great Sprout-Off!{'\n'}Ask me anything about your sprouts!
              </Text>
            </View>
          )}
          {messages.map(msg => (
            <View
              key={msg.id}
              className={`mb-3 max-w-[85%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}
            >
              <View className={`rounded-2xl px-4 py-2.5 ${
                msg.role === 'user'
                  ? 'bg-sprout-600 rounded-br-sm'
                  : 'bg-info-50 border border-info-200 rounded-bl-sm'
              }`}>
                <Text className={msg.role === 'user' ? 'text-white text-sm' : 'text-gray-700 text-sm'}>
                  {msg.content}
                </Text>
              </View>
            </View>
          ))}
          {loading && (
            <View className="self-start mb-3 max-w-[85%]">
              <View className="bg-info-50 border border-info-200 rounded-2xl rounded-bl-sm px-4 py-2.5">
                <Text className="text-gray-400 italic text-sm">The Genie is consulting the sprouts...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Suggested questions */}
        {messages.length < 2 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pb-2">
            {suggestions.map(q => (
              <Pressable
                key={q}
                className="mr-2 px-3 py-1.5 rounded-chip bg-sprout-50 border border-sprout-200"
                onPress={() => sendMessage(q)}
              >
                <Text className="text-sprout-600 text-xs">{q}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Input */}
        <View className="flex-row items-center px-4 py-3 border-t border-gray-100">
          <TextInput
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm mr-2"
            placeholder="Ask the Genie..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendMessage(input)}
            placeholderTextColor="#999"
            editable={!loading}
          />
          <Pressable
            className={`w-10 h-10 rounded-full items-center justify-center ${
              input.trim() && !loading ? 'bg-sprout-600' : 'bg-gray-300'
            }`}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading}
          >
            <Text className="text-white font-bold">{'\u2191'}</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
```

- [ ] **Step 2: Add `onPress` prop to `GemmaBubble`**

Replace the entire `components/GemmaBubble.tsx`:

```typescript
/**
 * SproutPal — Gemma AI Bubble / Genie Entry Point
 * Displays AI-generated tips. Tap to open Genie chat.
 */

import { View, Text, Pressable } from 'react-native'

interface GemmaBubbleProps {
  message?: string
  characterName?: string
  characterEmoji?: string
  isLoading?: boolean
  onPress?: () => void
}

export function GemmaBubble({
  message,
  characterName,
  characterEmoji = '\ud83e\uddde',
  isLoading = false,
  onPress,
}: GemmaBubbleProps) {
  const content = (
    <View className="bg-info-50 border border-info-200 rounded-card p-4 mx-4 my-2">
      <View className="flex-row items-center mb-2">
        <Text className="text-lg mr-2">{characterEmoji}</Text>
        <Text className="text-sm font-medium text-info-600">
          {characterName ?? 'Sprout Genie'} says:
        </Text>
        {onPress && (
          <Text className="ml-auto text-xs text-info-400">Tap to chat {'\u203a'}</Text>
        )}
      </View>
      {isLoading ? (
        <Text className="text-gray-400 italic">Thinking...</Text>
      ) : (
        <Text className="text-gray-700 text-sm leading-5">
          {message ?? 'Tap to ask the Sprout Genie for advice!'}
        </Text>
      )}
    </View>
  )

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>
  }
  return content
}
```

- [ ] **Step 3: Commit**

```bash
git add components/GenieChat.tsx components/GemmaBubble.tsx
git commit -m "feat: add GenieChat bottom sheet and make GemmaBubble tappable"
```

---

## Task 7: PerformanceTab Component

**Files:**
- Create: `components/PerformanceTab.tsx`

- [ ] **Step 1: Create `components/PerformanceTab.tsx`**

```typescript
/**
 * SproutPal — Performance Analytics Tab
 * Stats cards, combo table, Genie analysis button
 */

import { View, Text, Pressable, ScrollView } from 'react-native'
import { useState, useEffect } from 'react'
import { getPerformanceSummary, type PerformanceSummary, type ComboStats } from '@/lib/performance'

interface PerformanceTabProps {
  onOpenGenie: () => void
}

export function PerformanceTab({ onOpenGenie }: PerformanceTabProps) {
  const [data, setData] = useState<PerformanceSummary | null>(null)

  useEffect(() => {
    getPerformanceSummary().then(setData)
  }, [])

  if (!data || data.totalTrackedBatches === 0) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-5xl mb-4">{'\ud83d\udcca'}</Text>
        <Text className="text-xl font-bold text-sprout-800 mb-2">No yield data yet</Text>
        <Text className="text-gray-500 text-center">
          Complete a batch with yield tracking to see performance analytics.
        </Text>
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 p-4">
      {/* Stats cards */}
      <View className="flex-row gap-3 mb-4">
        <View className="flex-1 bg-sprout-50 rounded-card p-3 items-center">
          <Text className="text-2xl font-bold text-sprout-600">{data.totalTrackedBatches}</Text>
          <Text className="text-xs text-gray-500">Tracked</Text>
        </View>
        {data.bestCombo && (
          <View className="flex-1 bg-soak-50 rounded-card p-3 items-center">
            <Text className="text-2xl font-bold text-soak-600">{data.bestCombo.avgYieldRatio.toFixed(1)}x</Text>
            <Text className="text-xs text-gray-500">Best yield</Text>
          </View>
        )}
        {data.mostConsistent && (
          <View className="flex-1 bg-info-50 rounded-card p-3 items-center">
            <Text className="text-2xl font-bold text-info-600">{data.mostConsistent.avgYieldRatio.toFixed(1)}x</Text>
            <Text className="text-xs text-gray-500">Most consistent</Text>
          </View>
        )}
      </View>

      {/* Best combo highlight */}
      {data.bestCombo && (
        <View className="bg-sprout-50 border border-sprout-200 rounded-card p-4 mb-4">
          <Text className="text-sm font-medium text-sprout-800 mb-1">{'\ud83c\udfc6'} Best Combo</Text>
          <Text className="text-sprout-600">
            {data.bestCombo.beanEmoji} {data.bestCombo.beanName} in {data.bestCombo.containerName}
          </Text>
          <Text className="text-xs text-gray-500">
            {data.bestCombo.avgYieldRatio.toFixed(1)}x yield \u00b7 {data.bestCombo.avgFillPct.toFixed(0)}% fill \u00b7 {data.bestCombo.avgRating.toFixed(1)} stars \u00b7 {data.bestCombo.batchCount} batches
          </Text>
        </View>
      )}

      {/* Ask the Genie */}
      <Pressable
        className="bg-info-50 border border-info-200 rounded-card p-4 mb-4 flex-row items-center"
        onPress={onOpenGenie}
      >
        <Text className="text-xl mr-3">{'\ud83e\uddde'}</Text>
        <View className="flex-1">
          <Text className="text-info-600 font-medium">Ask the Genie</Text>
          <Text className="text-xs text-gray-500">Get AI-powered performance analysis</Text>
        </View>
        <Text className="text-info-400">{'\u203a'}</Text>
      </Pressable>

      {/* Combo table */}
      <Text className="text-lg font-bold text-sprout-800 mb-3">All Combos</Text>
      {data.combos.map((combo, i) => (
        <ComboRow key={`${combo.beanTypeId}-${combo.containerId}`} combo={combo} rank={i + 1} />
      ))}
    </ScrollView>
  )
}

function ComboRow({ combo, rank }: { combo: ComboStats; rank: number }) {
  return (
    <View className="flex-row items-center py-3 border-b border-gray-50">
      <Text className="text-sm text-gray-400 w-6">#{rank}</Text>
      <Text className="text-lg mr-2">{combo.beanEmoji}</Text>
      <View className="flex-1">
        <Text className="text-sm font-medium text-sprout-800">{combo.beanName}</Text>
        <Text className="text-xs text-gray-500">{combo.containerName}</Text>
      </View>
      <View className="items-end">
        <Text className="text-sm font-bold text-sprout-600">{combo.avgYieldRatio.toFixed(1)}x</Text>
        <Text className="text-xs text-gray-400">
          {combo.avgRating.toFixed(1)}{'\u2605'} \u00b7 {combo.batchCount} batches
        </Text>
      </View>
    </View>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/PerformanceTab.tsx
git commit -m "feat: add PerformanceTab with stats cards and combo table"
```

---

## Task 8: Wire Batch Creation — Container Picker + Seed Amount

**Files:**
- Modify: `app/batch/new.tsx`

- [ ] **Step 1: Add imports and state for container and seed amount**

At the top of `app/batch/new.tsx`, add to imports:

```typescript
import { ContainerPicker } from '@/components/ContainerPicker'
import { getYieldHint } from '@/lib/performance'
```

In the `NewBatchScreen` component, add state variables after the existing ones:

```typescript
  const [containerId, setContainerId] = useState<string | null>(null)
  const [seedAmount, setSeedAmount] = useState('')
  const [yieldHint, setYieldHint] = useState<string | null>(null)
```

- [ ] **Step 2: Auto-fill seed amount when bean type selected**

Add a `useEffect` after the existing `selectedBeanTypeId` effects:

```typescript
  // Auto-fill seed amount from bean type default
  useEffect(() => {
    if (selectedBean) {
      setSeedAmount(String(selectedBean.seedAmountGrams))
    }
  }, [selectedBean])

  // Fetch yield hint when container+bean combo changes
  useEffect(() => {
    if (selectedBeanTypeId && containerId) {
      getYieldHint(selectedBeanTypeId, containerId).then(setYieldHint)
    } else {
      setYieldHint(null)
    }
  }, [selectedBeanTypeId, containerId])
```

- [ ] **Step 3: Update Step3JarTiming to include container picker and seed amount**

In the `Step3JarTiming` component, add props: `containerId`, `onContainerId`, `seedAmount`, `onSeedAmount`, `yieldHint`. Then add to the JSX before the jar label input:

```tsx
      <Text className="text-sm font-medium text-gray-500 mb-2">Seed amount (grams)</Text>
      <View className="flex-row items-center gap-2 mb-4">
        <TextInput
          className="bg-gray-100 rounded-card px-4 py-3 text-base flex-1"
          value={seedAmount}
          onChangeText={onSeedAmount}
          keyboardType="numeric"
          placeholder="20"
          placeholderTextColor="#999"
        />
        <Text className="text-sm text-gray-400">grams</Text>
      </View>

      <ContainerPicker
        selectedId={containerId}
        onSelect={onContainerId}
        yieldHint={yieldHint}
      />
```

- [ ] **Step 4: Pass container and seed amount into `createBatch`**

In the `createBatch` function, add these to the `db.insert(batches).values({...})` call:

```typescript
        containerId: containerId,
        seedAmountGrams: parseFloat(seedAmount) || selectedBean.seedAmountGrams,
```

- [ ] **Step 5: Update Step3JarTiming and Step5Confirm props to thread the new values through**

Update the `step === 2` render to pass the new props:

```tsx
      {step === 2 && selectedBean && (
        <Step3JarTiming
          bean={selectedBean}
          jarLabel={jarLabel}
          onJarLabel={setJarLabel}
          startNow={startNow}
          onStartNow={setStartNow}
          containerId={containerId}
          onContainerId={setContainerId}
          seedAmount={seedAmount}
          onSeedAmount={setSeedAmount}
          yieldHint={yieldHint}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
```

Update the `Step3JarTiming` type signature to accept the new props.

- [ ] **Step 6: Commit**

```bash
git add app/batch/new.tsx
git commit -m "feat: wire container picker and seed amount into batch creation wizard"
```

---

## Task 9: Wire Harvest Flow — Yield Weight, Fill %, Yield Ratio

**Files:**
- Modify: `app/batch/[id].tsx`

- [ ] **Step 1: Add state for harvest yield fields**

In the `BatchDetailScreen` component, add after the existing harvest state:

```typescript
  const [harvestWeight, setHarvestWeight] = useState('')
  const [harvestFillPct, setHarvestFillPct] = useState<number>(0)
```

- [ ] **Step 2: Update `confirmHarvest` to save yield data**

In the `confirmHarvest` function, compute yield ratio and save:

```typescript
  const confirmHarvest = async () => {
    if (batch.notificationIds) {
      const ids: string[] = JSON.parse(batch.notificationIds)
      await cancelBatchNotifications(ids)
    }

    const germPct = harvestGermination ? parseFloat(harvestGermination) : null
    const yieldGrams = harvestWeight ? parseFloat(harvestWeight) : null
    const seedGrams = batch.seedAmountGrams ?? 0
    const yieldRatio = (yieldGrams && seedGrams > 0) ? yieldGrams / seedGrams : null

    await db.update(batches)
      .set({
        status: 'harvested',
        actualHarvestAt: Date.now(),
        germinationPct: germPct,
        userRating: harvestRating > 0 ? harvestRating : null,
        harvestNotes: harvestNotes || null,
        harvestYieldGrams: yieldGrams,
        containerFillPct: harvestFillPct > 0 ? harvestFillPct : null,
        yieldRatio: yieldRatio,
        updatedAt: Date.now(),
      })
      .where(eq(batches.id, batch.id))

    setShowHarvestModal(false)
    router.back()
  }
```

- [ ] **Step 3: Add yield fields to harvest rate step UI**

In the harvest modal's `rate` step, add before the "Complete Harvest" button:

```tsx
            {/* Harvest weight */}
            <Text className="text-sm font-medium text-gray-500 mb-2">Harvest weight (grams)</Text>
            <TextInput
              className="bg-gray-100 rounded-card px-4 py-3 text-base mb-4"
              value={harvestWeight}
              onChangeText={setHarvestWeight}
              placeholder="e.g., 130"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />

            {/* Container fill % */}
            <Text className="text-sm font-medium text-gray-500 mb-2">How full was the container?</Text>
            <View className="flex-row gap-2 mb-2">
              {[25, 50, 75, 100].map(pct => (
                <Pressable
                  key={pct}
                  className={`flex-1 py-2 rounded-chip border items-center ${
                    harvestFillPct === pct ? 'bg-sprout-200 border-sprout-400' : 'border-gray-200'
                  }`}
                  onPress={() => setHarvestFillPct(pct)}
                >
                  <Text className={harvestFillPct === pct ? 'text-sprout-800 text-sm font-medium' : 'text-gray-600 text-sm'}>
                    {pct}%
                  </Text>
                </Pressable>
              ))}
              <Pressable
                className={`flex-1 py-2 rounded-chip border items-center ${
                  harvestFillPct === 110 ? 'bg-soak-100 border-soak-400' : 'border-gray-200'
                }`}
                onPress={() => setHarvestFillPct(110)}
              >
                <Text className={harvestFillPct === 110 ? 'text-soak-800 text-sm font-medium' : 'text-gray-600 text-sm'}>
                  {'\ud83d\udca5'}
                </Text>
              </Pressable>
            </View>

            {/* Yield ratio preview */}
            {harvestWeight && batch.seedAmountGrams && (
              <View className="bg-sprout-50 rounded-card p-3 mb-4">
                <Text className="text-sm text-sprout-600 font-medium">
                  Yield: {(parseFloat(harvestWeight) / batch.seedAmountGrams).toFixed(1)}x from {batch.seedAmountGrams}g seed
                </Text>
              </View>
            )}
```

- [ ] **Step 4: Commit**

```bash
git add app/batch/[id].tsx
git commit -m "feat: wire yield tracking into harvest flow — weight, fill %, yield ratio"
```

---

## Task 10: Wire Genie Chat Into Screens

**Files:**
- Modify: `app/(tabs)/index.tsx`
- Modify: `app/batch/[id].tsx`
- Modify: `app/(tabs)/history.tsx`

- [ ] **Step 1: Add Genie chat to Farm View**

In `app/(tabs)/index.tsx`, add import:
```typescript
import { GenieChat } from '@/components/GenieChat'
```

Add state:
```typescript
const [showGenie, setShowGenie] = useState(false)
```

Update the `GemmaBubble` in `FunView` to add `onPress`:
```tsx
<GemmaBubble
  message={gemmaTip ?? undefined}
  characterName={urgentBatch?.characterName}
  characterEmoji={urgentBatch?.characterEmoji}
  onPress={() => setShowGenie(true)}
/>
```

Add `GenieChat` at the end of the return, before the closing `</View>`:
```tsx
      <GenieChat
        visible={showGenie}
        onClose={() => setShowGenie(false)}
        screenContext={{ screen: 'farm' }}
      />
```

Pass `setShowGenie` into `FunView` and `BusinessView` as needed.

- [ ] **Step 2: Add Genie chat to Batch Detail**

In `app/batch/[id].tsx`, add import:
```typescript
import { GenieChat } from '@/components/GenieChat'
```

Add state:
```typescript
const [showGenie, setShowGenie] = useState(false)
```

Update the `GemmaBubble` to add `onPress`:
```tsx
<GemmaBubble
  characterName={character.name}
  characterEmoji={character.accessoryEmoji}
  message={gemmaInsight ?? character.catchphrase}
  isLoading={gemmaLoading}
  onPress={() => setShowGenie(true)}
/>
```

Add `GenieChat` before the closing `</>`:
```tsx
      <GenieChat
        visible={showGenie}
        onClose={() => setShowGenie(false)}
        screenContext={{ screen: 'batch', batchId: id }}
      />
```

- [ ] **Step 3: Add Performance tab and Genie to History**

In `app/(tabs)/history.tsx`, add imports:
```typescript
import { PerformanceTab } from '@/components/PerformanceTab'
import { GenieChat } from '@/components/GenieChat'
```

Add state:
```typescript
const [showGenie, setShowGenie] = useState(false)
```

Add a third tab option `'performance'` and render:
```tsx
{tab === 'performance' && (
  <PerformanceTab onOpenGenie={() => setShowGenie(true)} />
)}

<GenieChat
  visible={showGenie}
  onClose={() => setShowGenie(false)}
  screenContext={{ screen: 'performance' }}
/>
```

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/index.tsx app/batch/[id].tsx app/(tabs)/history.tsx
git commit -m "feat: wire Genie chat into Farm View, Batch Detail, and History"
```

---

## Task 11: Wire Settings — Coach Intensity + Container Management

**Files:**
- Modify: `app/settings.tsx`

- [ ] **Step 1: Add coach intensity selector**

In `app/settings.tsx`, add import:
```typescript
import { getAllContainers, deleteContainer } from '@/lib/containers'
import type { containers as containersTable } from '@/db/schema'
```

Add state:
```typescript
const [coachIntensity, setCoachIntensity] = useState<'minimal' | 'moderate' | 'full'>('full')
const [containerList, setContainerList] = useState<(typeof containersTable.$inferSelect)[]>([])
```

In `useEffect`, load:
```typescript
setCoachIntensity((getKVStore(KV_KEYS.COACH_INTENSITY) as any) ?? 'full')
getAllContainers().then(setContainerList)
```

Add a new `SettingSection` after Notification Voice:

```tsx
<SettingSection title="Coach Intensity">
  <Text className="text-xs text-gray-400 mb-3">How often should the Genie send proactive tips?</Text>
  <View className="flex-row gap-2">
    {(['minimal', 'moderate', 'full'] as const).map(level => (
      <Pressable
        key={level}
        className={`flex-1 py-3 rounded-card items-center border ${
          coachIntensity === level ? 'bg-sprout-600 border-sprout-600' : 'border-gray-200'
        }`}
        onPress={() => {
          setCoachIntensity(level)
          setKVStore(KV_KEYS.COACH_INTENSITY, level)
        }}
      >
        <Text className={coachIntensity === level ? 'text-white font-bold text-sm capitalize' : 'text-gray-600 text-sm capitalize'}>
          {level}
        </Text>
      </Pressable>
    ))}
  </View>
  <Text className="text-xs text-gray-400 mt-2">
    {coachIntensity === 'minimal' && 'Rinse + harvest + risk alerts only'}
    {coachIntensity === 'moderate' && '+ Morning briefing + daily tips'}
    {coachIntensity === 'full' && '+ Real-time coaching, patterns, performance nudges'}
  </Text>
</SettingSection>
```

- [ ] **Step 2: Add container management section**

```tsx
<SettingSection title="My Containers">
  {containerList.map(c => (
    <View key={c.id} className="flex-row items-center justify-between py-2 border-b border-gray-50">
      <View>
        <Text className="text-sm font-medium text-gray-700">{c.name}</Text>
        <Text className="text-xs text-gray-400">{c.capacityOz > 0 ? `${c.capacityOz}oz` : 'Flat tray'}</Text>
      </View>
      <Pressable
        className="px-3 py-1 rounded border border-gray-200"
        onPress={async () => {
          await deleteContainer(c.id)
          getAllContainers().then(setContainerList)
        }}
      >
        <Text className="text-xs text-gray-500">Remove</Text>
      </Pressable>
    </View>
  ))}
  <Text className="text-xs text-gray-400 mt-2">Add new containers when creating a batch.</Text>
</SettingSection>
```

- [ ] **Step 3: Commit**

```bash
git add app/settings.tsx
git commit -m "feat: add coach intensity selector and container management to settings"
```

---

## Task 12: Final Migration + TypeScript Verification

**Files:**
- All modified files

- [ ] **Step 1: Run drizzle migration generation**

Run: `npx drizzle-kit generate`
Expected: new migration file created for all schema changes.

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors (excluding the known ExternalLink.tsx if it still exists).

- [ ] **Step 3: Verify Metro bundler starts**

Run: `npx expo start --no-dev` (kill after it starts successfully)
Expected: "Waiting on http://localhost:8081" with no errors.

- [ ] **Step 4: Commit any remaining fixes**

```bash
git add -A
git commit -m "chore: migration generation and final verification"
```
