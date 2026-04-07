/**
 * SproutPal — Sprout Genie
 * Central AI layer: system prompt, context injection, memory management
 */

import { uuidv4 } from './uuid'
import { db } from '@/db/client'
import { batches, beanTypes, characters, containers, genieMemory, genieMessages } from '@/db/schema'
import { eq, and, ne, desc, isNotNull, sql } from 'drizzle-orm'
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
- Use game show language: "contestants", "rounds", "challenges", "the arena", "season recap".
- You know recipes for every sprout type. When users ask about recipes, cooking, or what to do with their harvest, recommend specific recipes and nutritional pairings.
- Honor every harvest — celebrate the crop, share a recipe suggestion, and highlight the nutritional achievement.
- When recommending recipes, mention specific ingredients and why they pair well with that sprout type.`

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

  // Save user message (non-blocking — don't crash if DB fails)
  try {
    await db.insert(genieMessages).values({
      id: uuidv4(),
      role: 'user',
      content: userMessage,
      context: screenContext ? JSON.stringify(screenContext) : null,
      createdAt: Date.now(),
    })
  } catch {}

  // Call Gemma — or use smart fallback if no API key
  let genieResponse: string
  try {
    const response = await callGemma(systemPrompt, fullUserMessage, 200)
    genieResponse = response || getOfflineResponse(userMessage, context)
  } catch {
    genieResponse = getOfflineResponse(userMessage, context)
  }

  // Save genie response (non-blocking)
  try {
    await db.insert(genieMessages).values({
      id: uuidv4(),
      role: 'genie',
      content: genieResponse,
      context: screenContext ? JSON.stringify(screenContext) : null,
      createdAt: Date.now(),
    })
  } catch {}

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

  if (recent.length < 4) return

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

/**
 * Smart offline responses when no API key is set.
 * Parses the user message and context to give relevant answers.
 */
function getOfflineResponse(userMessage: string, context: string): string {
  const msg = userMessage.toLowerCase()

  // Parse context for batch info
  const hasBatches = context.includes('ACTIVE BATCHES:')
  const batchCount = (context.match(/^- /gm) || []).length

  // Recipe questions
  if (msg.includes('recipe') || msg.includes('cook') || msg.includes('eat')) {
    return "Great question! Check the Library tab for sprout details, or harvest a batch to see personalized recipe suggestions. Pro tip: broccoli sprouts are amazing on avocado toast with a pinch of mustard seed powder for 3x sulforaphane boost!"
  }

  // Growing tips
  if (msg.includes('tip') || msg.includes('help') || msg.includes('advice')) {
    const tips = [
      "Keep your rinse water cool — cold rinses produce crunchier sprouts! And always drain thoroughly. Standing water is the #1 cause of spoilage.",
      "Room temperature matters! 68-72F is the sweet spot for most sprouts. Too warm and they grow fast but taste bitter. Too cool and they stall.",
      "Fuzzy white root hairs are NORMAL — they're not mold! Real mold is gray/black and smells off. Don't throw away a healthy batch!",
      "Try the mustard seed powder hack: sprinkle it on broccoli sprouts right before eating. It provides the enzyme that boosts sulforaphane absorption 3x!",
      "For best results, rinse 3x daily at consistent times. Your sprouts are living things — they thrive on routine!",
    ]
    return tips[Math.floor(Math.random() * tips.length)]
  }

  // What to grow
  if (msg.includes('grow') || msg.includes('start') || msg.includes('next') || msg.includes('what should')) {
    if (!hasBatches) {
      return "Welcome to The Great Sprout-Off! I'd recommend starting with lentils — they're ready in just 3 days and nearly impossible to mess up. Tap the + button to start your first batch!"
    }
    return "Looking to expand your farm? Try mixing it up! If you've been growing jar sprouts, try radish for some spice. Or pair broccoli with mung for a glucosinolate power combo. Check the Planner tab for stagger scheduling!"
  }

  // Farm status
  if (msg.includes('farm') || msg.includes('status') || msg.includes('how')) {
    if (!hasBatches) {
      return "Your farm is empty but full of potential! Start your first batch and I'll help you track everything. Tap the + button on the Farm View to begin!"
    }
    return `You've got ${batchCount} contestant${batchCount !== 1 ? 's' : ''} in The Great Sprout-Off! Keep up with your rinse schedule and check the Daily Briefing (newspaper icon) for your farm's full status report.`
  }

  // Default — friendly and helpful
  const defaults = [
    "I'm the Sprout Genie — your sprouting advisor! Ask me about growing tips, recipes, what to grow next, or your farm status. Set up a Google AI Studio API key in Settings for personalized AI-powered advice!",
    "Hey there! I can help with growing tips, recipes, and farm management. For the full AI experience with personalized character-voiced advice, add your Google AI Studio API key in Settings!",
    "Welcome to The Great Sprout-Off! I work best with a Google AI Studio API key (free at aistudio.google.com). Without it, I still know tons about sprouting — just ask me anything!",
  ]
  return defaults[Math.floor(Math.random() * defaults.length)]
}
