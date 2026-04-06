# Yield Tracking & Sprout Genie — Design Spec

**Date:** 2026-04-05
**Status:** Draft
**Scope:** Container inventory, batch yield tracking, performance analytics, Sprout Genie AI layer

---

## 1. Container Inventory System

### 1.1 `containers` table (new)

| Column | Type | Notes |
|---|---|---|
| id | text PK | UUID |
| name | text | Custom name: "Big Ball jar", "Kitchen tray" |
| type | text | 'quart_jar' \| 'half_gallon_jar' \| 'pint_jar' \| 'wide_mouth_quart' \| 'sprouting_tray' \| 'custom' |
| capacityOz | real | Capacity in fluid ounces |
| notes | text | Optional user notes ("by the window", "red lid") |
| isActive | integer boolean | Soft delete |
| createdAt | integer | Unix timestamp |

### 1.2 Pre-seeded containers

On first launch, seed these defaults:

| Name | Type | Capacity |
|---|---|---|
| Quart Mason Jar | quart_jar | 32 oz |
| Half-Gallon Jar | half_gallon_jar | 64 oz |
| Pint Mason Jar | pint_jar | 16 oz |
| Wide-Mouth Quart | wide_mouth_quart | 32 oz |
| Sprouting Tray | sprouting_tray | 0 (flat) |

Users can add custom containers at any time — during batch creation or from a container management section in Settings.

Default containers are seeded on first launch alongside bean types in the existing `seedBeanTypesIfNeeded` function (renamed to `seedDefaultsIfNeeded` to reflect expanded scope).

### 1.3 Container picker UX

- Shown in batch creation wizard Step 3 (jar & timing)
- Dropdown/scrollable list of user's containers
- Each shows: name, type icon, capacity
- "Add new container" inline option (name + type dropdown + capacity input)
- If historical yield data exists for selected sprout+container combo, show inline: "Your avg yield: 6.2x in this jar"

---

## 2. Batch Yield Tracking

### 2.1 New columns on `batches` table

| Column | Type | Notes |
|---|---|---|
| containerId | text FK → containers.id | Which container was used |
| seedAmountGrams | real | Actual seed weight used (pre-filled from bean type default, user-editable) |
| containerFillPct | real | How full the container was at harvest (0–100) |
| harvestYieldGrams | real | Weight of sprouts at harvest |
| yieldRatio | real | Computed: harvestYieldGrams / seedAmountGrams |

### 2.2 Batch creation changes (Step 3)

Current Step 3 has jar label and timing. Add:

1. **Suggested seed amount** — pre-filled from `beanType.seedAmountGrams`, shown as "Recommended: 20g for broccoli". User can edit.
2. **Container picker** — select from inventory or add new inline.
3. **Historical hint** — if 2+ batches exist for this sprout+container combo, show: "Your average yield with Broccoli in Quart Mason Jar: 6.2x (3 batches)"

### 2.3 Harvest flow changes

After the farewell screen and star rating, add:

1. **Harvest weight** — "How much did you harvest? (grams)" — numeric input
2. **Container fill %** — quick-tap buttons: 25% | 50% | 75% | 100% | Overflowing
3. Yield ratio auto-computed and displayed: "You got 6.5x from 20g seed!"
4. Genie analysis generated with full context (see Section 4)

---

## 3. Performance Analytics

### 3.1 New "Performance" tab on History screen

Added as a third tab alongside History and Seed Feedback.

**Stats cards (top):**
- Best overall yield ratio (sprout type + container + ratio)
- Most consistent performer (lowest variance in yield ratio)
- Total batches tracked

**Combo table:**
- Rows: each unique sprout type × container combination
- Columns: avg yield ratio, avg fill %, avg rating, batch count, trend arrow (improving/declining)
- Tap a row → detail view with all batches for that combo
- Sortable by any column

**Filters:**
- Sprout type chip selector
- Container chip selector
- Date range (Last 30 days / 90 days / All time)

**Genie integration:**
- "Ask the Genie" button at top → opens Genie chat pre-loaded with: "Analyze my performance data and recommend my best setup for each sprout type"
- Genie response shown inline if short, or opens full chat if detailed

### 3.2 Batch detail enhancement

On the batch detail screen, show a "Performance context" section:
- This batch's yield ratio vs. your average for this combo
- Rank: "This was your #2 best broccoli batch"
- Delta: "+0.3x above your average"

---

## 4. Sprout Genie — Central Intelligence Layer

### 4.1 Identity

The Sprout Genie is the unified AI personality behind all app intelligence. It replaces the current scattered Gemma integration points with a single, consistent, data-aware advisor.

**API:** Google AI Studio, `gemini-2.0-flash` (same as current)
**Fallback:** Static character messages + basic computed stats when no API key

### 4.2 System Prompt

```
You are the Sprout Genie — the enthusiastic, all-knowing host of SproutPal!

In FUN MODE you are a game show host running "The Great Sprout-Off!" Every batch
is a contestant. Every rinse is a challenge round. Every harvest is a finale with
dramatic reveals. You channel the personality of the user's sprout characters —
they're your contestants and you LOVE them. Use their catchphrases, reference their
fears, celebrate their talents. Be funny, dramatic, and wildly encouraging. Think
part Bob Barker, part David Attenborough, part over-caffeinated gardening aunt.

In BUSINESS MODE you are a precise sprouting consultant. Data-driven. Specific.
No personality, no game show. Just actionable insights in 2-3 sentences.

You have FULL ACCESS to the user's data:
- All active and archived batches with characters, containers, seed amounts, yields
- Container inventory and performance history
- Rinse logs with temps and observations
- Seed source tracking and adaptive timing offsets
- The user's conversation memory (summarized preferences and past advice)

Rules:
- Always reference actual data when giving advice. Never make up numbers.
- In fun mode: treat every interaction like a live show moment. Characters are real.
- In business mode: lead with the number, then the recommendation.
- Keep notifications under 40 words. Keep chat responses under 100 words unless
  the user asks for detail.
- When the user asks "what should I grow?" — check their history, find gaps,
  and recommend based on what they haven't tried or what performs well for them.
- Never be negative about failed batches. A discard is a "learning round."
```

### 4.3 Fun Mode Personality — The Great Sprout-Off

The Genie treats the app like a live game show:

- **Batch creation:** "Ladies and gentlemen, we have a NEW CONTESTANT! Señor Sprouty enters the arena with 20 grams of broccoli seed in the Quart Jar of Destiny!"
- **Rinse reminder:** "ROUND 3! Señor Sprouty needs hydration! Will our champion deliver? The clock is ticking, folks!"
- **Missed rinse:** "OH NO! It's been 3 hours! Señor Sprouty is looking PARCHED! Someone get this sprout some water! This could cost them the round!"
- **Harvest:** "AND THE RESULTS ARE IN! 130 grams! That's a 6.5x yield! Señor Sprouty takes the LEAD in the Broccoli Division! The crowd goes wild!"
- **Performance review:** "Season recap! Your MVP: Mung beans in the Half-Gallon Arena with a 7.2x average. Your most improved: Lentils, up 15% since last month!"

Characters retain their individual personalities within the game show frame — the Dramatist makes everything sound like a soap opera finale, the Grump reluctantly participates, the Scientist insists on being judged by sulforaphane metrics only.

### 4.4 Chat Interface

**Entry points:**
- Tap any GemmaBubble (Farm View, Batch Detail, Performance tab) → opens full chat sheet
- Chat is context-aware: if opened from batch detail, Genie knows which batch; from Performance, it has stats context

**Chat UI:**
- Bottom sheet that slides up to ~80% screen height
- Message bubbles: Genie on left (with small Genie emoji), user on right
- Text input at bottom with send button
- "Suggested questions" chips above input: context-dependent
  - From Farm View: "How's my farm doing?" / "What should I start next?"
  - From Batch Detail: "Tips for this batch?" / "Compare to my history"
  - From Performance: "What's my best setup?" / "How can I improve?"

**Context injection:**
Each chat message to Gemma includes a data snapshot injected into the user message (kept under 800 tokens to leave room for response):
- Active batches summary (type, container, day number, status) — ~200 tokens
- Current batch detail if opened from batch screen — ~150 tokens
- Performance stats summary (top 5 combos) if opened from Performance tab — ~150 tokens
- Conversation memory summary (last 5 memory entries) — ~200 tokens
- If context exceeds budget, prioritize: current screen context > memory > stats

### 4.5 Conversation Memory

**`genie_memory` table:**

| Column | Type | Notes |
|---|---|---|
| id | text PK | UUID |
| category | text | 'preference' \| 'insight' \| 'recommendation' \| 'user_goal' |
| summary | text | Auto-summarized key point |
| createdAt | integer | Unix timestamp |
| expiresAt | integer | Optional: some memories auto-expire (e.g., seasonal tips) |

**`genie_messages` table:**

| Column | Type | Notes |
|---|---|---|
| id | text PK | UUID |
| role | text | 'user' \| 'genie' |
| content | text | Message text |
| context | text | JSON: which screen, which batch, what data was injected |
| createdAt | integer | Unix timestamp |

- Recent messages kept for session display (last 50 messages shown in chat)
- After each chat session (user closes the sheet), Genie auto-summarizes key points → saves to `genie_memory`
- Old messages pruned after 7 days; memory summaries persist indefinitely
- Memory injected into system prompt: "You previously advised this user to try larger containers for broccoli. They prefer morning rinse times. Their goal is consistent 6x+ yields."

### 4.6 Notification Orchestration

The Genie becomes the single source of all notification content, replacing the current per-call Gemma generation.

**Notification types and coach levels:**

| Notification | Minimal | Moderate | Full |
|---|---|---|---|
| Rinse reminders | Yes | Yes | Yes |
| Harvest alerts | Yes | Yes | Yes |
| Risk warnings (missed rinse, high temp) | Yes | Yes | Yes |
| Morning briefing | No | Yes | Yes |
| Per-batch daily tip | No | Yes | Yes |
| Stage transition coaching | No | No | Yes |
| Performance nudges | No | No | Yes |
| Pattern detection alerts | No | No | Yes |

**Morning briefing example (fun mode):**
"Good morning! The Sprout-Off update: 3 contestants active! Señor Sprouty (Day 3, looking strong), Lady Fern (soaking, almost ready for the jar), and Mighty Rex (HARVEST DAY!). Today's challenge: Don't forget Señor Sprouty's 3 PM rinse!"

**Notification generation strategy:**
- Pre-generate and cache morning briefings at midnight (or first app open)
- Rinse notifications: generate fresh at scheduled time (50 tokens, fast)
- Performance nudges: generate after each harvest, cache result
- All cached on `daily_logs.gemma_analysis` or a new `genie_notifications_cache` table
- Fallback: static character-keyed messages when API unavailable

**Coach intensity setting:**
- Added to Settings screen as a 3-option selector: Minimal / Moderate / Full
- Default: Full (user chose full coach mode; adjustable down)
- Stored in KV store as `coachIntensity`

### 4.7 Character Integration

Characters remain the per-batch personalities. The Genie is the host who works with them:

- In fun mode notifications, the Genie frames the message as the character speaking within the game show: "FROM THE JAR: Señor Sprouty reports: 'Every drop of water is a gift I barely survive without!' — Translation: it's rinse time."
- In chat, when discussing a specific batch, the Genie channels that character's voice
- When discussing multiple batches, the Genie is the host commenting on all contestants
- In business mode, characters are ignored entirely — Genie is pure data advisor

---

## 5. Schema Migration Summary

**New tables:**
- `containers` — container inventory
- `genie_memory` — summarized conversation insights
- `genie_messages` — recent chat messages

**Modified tables:**
- `batches` — add: containerId, seedAmountGrams, containerFillPct, harvestYieldGrams, yieldRatio

**New KV keys:**
- `coachIntensity` → 'minimal' | 'moderate' | 'full'

---

## 6. Screen Changes Summary

| Screen | Changes |
|---|---|
| Batch creation (Step 3) | Add seed amount input, container picker, historical yield hint |
| Harvest flow | Add harvest weight, container fill %, yield display |
| Batch detail | Add performance context section, GemmaBubble opens Genie chat |
| Farm View | GemmaBubble becomes Genie chat entry, morning briefing display |
| History | New Performance tab with combo table, stats cards, Genie button |
| Settings | Add coach intensity selector, container management section |
| New: Genie Chat | Bottom sheet chat UI with context-aware suggested questions |

---

## 7. Files to Create/Modify

**New files:**
- `components/GenieChat.tsx` — full chat bottom sheet UI
- `components/ContainerPicker.tsx` — container selection + add new
- `components/PerformanceTab.tsx` — performance analytics display
- `lib/genie.ts` — Genie system prompt builder, context injection, memory management
- `lib/containers.ts` — container CRUD + seed helpers

**Modified files:**
- `db/schema.ts` — new tables + batch columns
- `db/queries.ts` — performance queries (yield averages, combo stats)
- `lib/gemma.ts` — refactor to route through Genie
- `lib/notifications.ts` — Genie-orchestrated notification content
- `lib/seed.ts` — seed container defaults
- `app/batch/new.tsx` — Step 3 additions
- `app/batch/[id].tsx` — performance context, Genie chat entry
- `app/(tabs)/index.tsx` — Genie chat entry from Farm View bubble
- `app/(tabs)/history.tsx` — Performance tab
- `app/settings.tsx` — coach intensity + container management
- `data/characters.ts` — update buildGemmaSystemPrompt to Genie prompt
