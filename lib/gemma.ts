/**
 * SproutPal — Gemma API Client
 * Google AI Studio API integration for character-voiced advice
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import type { CharacterTraits, PersonalityKey } from '@/data/characters'
import { buildGemmaSystemPrompt, NOTIFICATION_PROMPTS, DISTRESS_MESSAGES } from '@/data/characters'
import type { BeanType } from '@/data/sproutTypes'
import { getKVStore, KV_KEYS } from './kvstore'

function getApiKey(): string | null {
  return getKVStore(KV_KEYS.GOOGLE_AI_API_KEY)
}

export async function callGemma(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 120,
): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) return ''

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt,
  })

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.8 },
  })

  return result.response.text().trim()
}

function getFallbackMessage(
  character: CharacterTraits,
  promptType: string,
): string {
  if (promptType === 'rinseOverdue') {
    return DISTRESS_MESSAGES[character.personality as PersonalityKey]
  }
  return character.catchphrase
}

export async function generateNotificationText(
  character: CharacterTraits,
  beanType: BeanType,
  promptType: keyof typeof NOTIFICATION_PROMPTS,
  promptArgs: any[],
  userName: string,
  mode: 'fun' | 'business' = 'fun',
): Promise<string> {
  const system = buildGemmaSystemPrompt(character, beanType, mode, userName)
  const userMsg = (NOTIFICATION_PROMPTS[promptType] as Function)(...promptArgs)

  try {
    const text = await callGemma(system, userMsg, 60)
    return text || getFallbackMessage(character, promptType)
  } catch {
    return getFallbackMessage(character, promptType)
  }
}

/**
 * Generate a tip for the Farm View Gemma bubble.
 * Falls back to catchphrase if API key not set.
 */
export async function generateFarmTip(
  character: CharacterTraits,
  beanType: { name: string; gemmaContext: string },
  dayNumber: number,
  mode: 'fun' | 'business' = 'fun',
): Promise<string> {
  const system = buildGemmaSystemPrompt(character, beanType, mode)
  const prompt = `Give a quick tip for day ${dayNumber} of growing ${beanType.name}. Be specific and helpful.`

  try {
    const text = await callGemma(system, prompt, 80)
    return text || character.catchphrase
  } catch {
    return character.catchphrase
  }
}

/**
 * Generate Gemma analysis after a rinse log with observations.
 */
export async function generateRinseAnalysis(
  character: CharacterTraits,
  beanType: { name: string; gemmaContext: string },
  stage: string,
  observations: string[],
  tempF?: number,
  mode: 'fun' | 'business' = 'fun',
): Promise<string> {
  const system = buildGemmaSystemPrompt(character, beanType, mode)
  const prompt = NOTIFICATION_PROMPTS.stageObservation(stage, observations, tempF)

  try {
    const text = await callGemma(system, prompt, 80)
    return text || character.catchphrase
  } catch {
    return character.catchphrase
  }
}

/**
 * Generate batch analysis on harvest completion.
 */
export async function generateHarvestAnalysis(
  character: CharacterTraits,
  beanType: { name: string; gemmaContext: string },
  soakHours: number,
  growDays: number,
  tempF: number,
  germinationPct: number,
  rating: number,
): Promise<string> {
  const system = buildGemmaSystemPrompt(character, beanType, 'business')
  const prompt = NOTIFICATION_PROMPTS.batchAnalysis(soakHours, growDays, tempF, germinationPct, rating)

  try {
    const text = await callGemma(system, prompt, 150)
    return text || 'Batch analysis complete. Update your seed profile for better results next time.'
  } catch {
    return 'Batch analysis complete. Update your seed profile for better results next time.'
  }
}

/**
 * Generate harvest celebration message with recipe recommendation.
 */
export async function generateHarvestCelebration(
  character: CharacterTraits,
  beanType: { name: string; gemmaContext: string },
  yieldRatio: number | null,
  harvestGrams: number | null,
  rating: number | null,
  recipeTitles: string[],
): Promise<string> {
  const system = buildGemmaSystemPrompt(character, beanType, 'fun')
  const recipeList = recipeTitles.length > 0
    ? `Available recipes: ${recipeTitles.join(', ')}.`
    : ''

  const prompt = `The user just harvested their ${beanType.name} sprouts!${
    yieldRatio ? ` Yield: ${yieldRatio.toFixed(1)}x.` : ''
  }${harvestGrams ? ` Total: ${harvestGrams}g.` : ''}${
    rating ? ` They rated it ${rating}/5 stars.` : ''
  } ${recipeList}

Generate a celebration message that:
1. Celebrates the harvest in character (game show style)
2. Mentions a specific nutritional highlight
3. Recommends one recipe from the list and explain why it's perfect for this harvest
Keep it under 80 words. Be enthusiastic and specific.`

  try {
    const text = await callGemma(system, prompt, 120)
    return text || `${character.name} celebrates: "${character.catchphrase}"`
  } catch {
    return `${character.name} celebrates: "${character.catchphrase}"`
  }
}

/**
 * Check if Gemma API is available (key is set).
 */
export function isGemmaAvailable(): boolean {
  return !!getApiKey()
}
