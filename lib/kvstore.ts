/**
 * SproutPal — KV Store
 * Uses the main Drizzle database connection for KV operations
 * to avoid multiple connections to the same SQLite file on web
 */

import { Platform } from 'react-native'

// Lazy reference to the main DB — avoids circular import issues
let _rawDb: any = null

function getRawDb() {
  if (_rawDb) return _rawDb
  // Get the raw expo-sqlite database from our Drizzle client
  // This is set by initKvDb() called from DatabaseProvider
  return null
}

/**
 * Initialize KV store with a raw expo-sqlite database reference.
 * Called from DatabaseProvider after the DB is ready.
 */
export function initKvDb(rawDb: any) {
  _rawDb = rawDb
}

/**
 * Sync init for native — called separately since native can openDatabaseSync
 */
export function initKvDbNative() {
  if (Platform.OS === 'web' || _rawDb) return
  const { openDatabaseSync } = require('expo-sqlite')
  _rawDb = openDatabaseSync('sproutpal.db')
}

export function getKVStore(key: string): string | null {
  const db = getRawDb()
  if (!db) return null
  try {
    const row = db.getFirstSync<{ value: string }>(
      'SELECT value FROM kv_store WHERE key = ?',
      [key]
    )
    return row?.value ?? null
  } catch {
    return null
  }
}

export function setKVStore(key: string, value: string): void {
  const db = getRawDb()
  if (!db) return
  db.runSync(
    `INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)`,
    [key, value]
  )
}

export function ensureKVTable(): void {
  const db = getRawDb()
  if (!db) return
  db.runSync(
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
