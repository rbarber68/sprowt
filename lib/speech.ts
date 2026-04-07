/**
 * SproutPal — Character Voice (TTS)
 * Device text-to-speech with personality-mapped voice parameters
 * Auto-selects highest quality voice available on the device
 */

import * as Speech from 'expo-speech'
import type { PersonalityKey } from '@/data/characters'
import { getKVStore, KV_KEYS } from './kvstore'

interface VoiceParams {
  rate: number
  pitch: number
  preferFemale?: boolean  // Some personalities suit different voice genders
}

export const PERSONALITY_VOICE_MAP: Record<PersonalityKey, VoiceParams> = {
  cheerleader:   { rate: 1.2, pitch: 1.3, preferFemale: true },
  grump:         { rate: 0.75, pitch: 0.75 },
  scientist:     { rate: 0.9, pitch: 1.0 },
  zen:           { rate: 0.6, pitch: 0.9 },
  dramatist:     { rate: 0.8, pitch: 1.15 },
  philosopher:   { rate: 0.7, pitch: 0.9 },
  rebel:         { rate: 1.05, pitch: 0.85 },
  hypochondriac: { rate: 1.1, pitch: 1.2, preferFemale: true },
  coach:         { rate: 1.15, pitch: 1.05 },
  foodie:        { rate: 0.95, pitch: 1.1, preferFemale: true },
}

export const VOICE_STYLE_LANGUAGE_MAP: Record<string, string> = {
  'British aristocrat': 'en-GB',
  'Southern grandma': 'en-US',
  'Old West cowboy': 'en-US',
  'Pirate': 'en-GB',
  'Shakespearean': 'en-GB',
  'Nature documentary narrator': 'en-GB',
  'News anchor formal': 'en-US',
  'Valley girl': 'en-US',
  'Surfer dude': 'en-US',
  'Gen Z': 'en-US',
  'Infomercial host': 'en-US',
  'Film noir detective': 'en-US',
}

// Cache the best voice per language
let _voiceCache: Record<string, Speech.Voice | null> = {}
let _voicesLoaded = false

/**
 * Find the best quality voice for a given language.
 * Prefers: network voices > "enhanced" > "high" > default
 */
async function getBestVoice(language: string, preferFemale?: boolean): Promise<Speech.Voice | null> {
  const cacheKey = `${language}_${preferFemale ? 'f' : 'm'}`
  if (_voicesLoaded && _voiceCache[cacheKey] !== undefined) return _voiceCache[cacheKey]

  try {
    const voices = await Speech.getAvailableVoicesAsync()
    _voicesLoaded = true

    // Filter to matching language
    const matching = voices.filter(v =>
      v.language.startsWith(language.split('-')[0]) ||
      v.language === language
    )

    if (matching.length === 0) {
      _voiceCache[cacheKey] = null
      return null
    }

    // Score voices — prefer high quality indicators
    const scored = matching.map(v => {
      let score = 0
      const id = (v.identifier ?? '').toLowerCase()
      const name = (v.name ?? '').toLowerCase()

      // Quality indicators
      if (v.quality === 'Enhanced') score += 100
      if (name.includes('neural') || name.includes('wavenet')) score += 80
      if (name.includes('enhanced') || name.includes('high')) score += 60
      if (id.includes('network') || id.includes('neural')) score += 50
      if (name.includes('natural')) score += 40

      // Gender preference
      if (preferFemale && (name.includes('female') || name.includes('woman') || id.includes('female'))) score += 20
      if (!preferFemale && (name.includes('male') || name.includes('man')) && !name.includes('female')) score += 20

      // Exact language match bonus
      if (v.language === language) score += 10

      return { voice: v, score }
    })

    scored.sort((a, b) => b.score - a.score)
    const best = scored[0]?.voice ?? matching[0]
    _voiceCache[cacheKey] = best
    return best
  } catch {
    _voiceCache[cacheKey] = null
    return null
  }
}

export async function speak(
  text: string,
  personality: PersonalityKey,
  voiceStyle?: string,
  onDone?: () => void,
): Promise<void> {
  try {
    const enabled = getKVStore(KV_KEYS.TTS_ENABLED) !== 'false'
    if (!enabled) return

    await Speech.stop()

    const params = PERSONALITY_VOICE_MAP[personality]
    const language = voiceStyle ? (VOICE_STYLE_LANGUAGE_MAP[voiceStyle] ?? 'en-US') : 'en-US'

    // Find the best available voice
    const bestVoice = await getBestVoice(language, params.preferFemale)

    const options: Speech.SpeechOptions = {
      rate: params.rate,
      pitch: params.pitch,
      language,
      onDone,
    }

    // Use the specific voice identifier if we found a good one
    if (bestVoice?.identifier) {
      options.voice = bestVoice.identifier
    }

    Speech.speak(text, options)
  } catch {
    // TTS failure should never crash the app
  }
}

export async function stopSpeaking(): Promise<void> {
  try {
    await Speech.stop()
  } catch {}
}

export async function isSpeaking(): Promise<boolean> {
  try {
    return await Speech.isSpeakingAsync()
  } catch {
    return false
  }
}

/**
 * List all available voices on the device (for debugging/settings)
 */
export async function listVoices(): Promise<Speech.Voice[]> {
  try {
    return await Speech.getAvailableVoicesAsync()
  } catch {
    return []
  }
}
