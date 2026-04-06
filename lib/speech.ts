/**
 * SproutPal — Character Voice (TTS)
 * Device text-to-speech with personality-mapped voice parameters
 */

import * as Speech from 'expo-speech'
import type { PersonalityKey } from '@/data/characters'
import { getKVStore, KV_KEYS } from './kvstore'

interface VoiceParams {
  rate: number
  pitch: number
}

export const PERSONALITY_VOICE_MAP: Record<PersonalityKey, VoiceParams> = {
  cheerleader:   { rate: 1.3, pitch: 1.4 },
  grump:         { rate: 0.7, pitch: 0.7 },
  scientist:     { rate: 0.9, pitch: 1.0 },
  zen:           { rate: 0.6, pitch: 0.9 },
  dramatist:     { rate: 0.85, pitch: 1.2 },
  philosopher:   { rate: 0.7, pitch: 0.95 },
  rebel:         { rate: 1.1, pitch: 0.85 },
  hypochondriac: { rate: 1.15, pitch: 1.25 },
  coach:         { rate: 1.2, pitch: 1.1 },
  foodie:        { rate: 1.0, pitch: 1.15 },
}

export const VOICE_STYLE_LANGUAGE_MAP: Record<string, string> = {
  'British aristocrat': 'en-GB',
  'Southern grandma': 'en-US',
  'Old West cowboy': 'en-US',
  'Pirate': 'en-GB',
  'Shakespearean': 'en-GB',
  'Nature documentary narrator': 'en-GB',
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
    const language = voiceStyle ? VOICE_STYLE_LANGUAGE_MAP[voiceStyle] : undefined

    Speech.speak(text, {
      rate: params.rate,
      pitch: params.pitch,
      language: language ?? 'en-US',
      onDone,
    })
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
