/**
 * SproutPal — Database Client
 * expo-sqlite + drizzle-orm setup
 * Single connection shared between Drizzle and KV store
 */

import { drizzle } from 'drizzle-orm/expo-sqlite'
import { openDatabaseSync, openDatabaseAsync } from 'expo-sqlite'
import { Platform } from 'react-native'
import * as schema from './schema'

let _expoDb: any = null
let _db: ReturnType<typeof drizzle> | null = null

// Native: initialize synchronously at module load
if (Platform.OS !== 'web') {
  _expoDb = openDatabaseSync('sproutpal.db')
  _db = drizzle(_expoDb, { schema })
}

/** Get the raw expo-sqlite database (for KV store to share) */
export function getRawDb() {
  return _expoDb
}

/** Async init for web — returns when WASM is ready */
export async function initDbAsync() {
  if (_db) return _db
  if (Platform.OS === 'web') {
    _expoDb = await openDatabaseAsync('sproutpal.db')
    _db = drizzle(_expoDb as any, { schema })
  }
  return _db!
}

// Proxy that forwards to the real db once initialized
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    if (!_db) {
      if (Platform.OS === 'web') return undefined
      throw new Error('Database not initialized')
    }
    return (_db as any)[prop]
  },
})
