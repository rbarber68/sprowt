/**
 * SproutPal — KV Store
 * Thin wrapper around expo-sqlite/kv-store for app settings
 */

import { openDatabaseSync } from 'expo-sqlite'

const kvDb = openDatabaseSync('sproutpal.db')

export function getKVStore(key: string): string | null {
  const row = kvDb.getFirstSync<{ value: string }>(
    'SELECT value FROM kv_store WHERE key = ?',
    [key]
  )
  return row?.value ?? null
}

export function setKVStore(key: string, value: string): void {
  kvDb.runSync(
    `INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)`,
    [key, value]
  )
}

export function ensureKVTable(): void {
  kvDb.runSync(
    `CREATE TABLE IF NOT EXISTS kv_store (key TEXT PRIMARY KEY, value TEXT NOT NULL)`
  )
}

// Default settings keys
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
  SOUNDS_MUTED: 'soundsMuted',
  TTS_ENABLED: 'ttsEnabled',
} as const
