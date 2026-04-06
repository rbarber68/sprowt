/**
 * SproutPal — Database Client
 * expo-sqlite + drizzle-orm setup
 */

import { drizzle } from 'drizzle-orm/expo-sqlite'
import { openDatabaseSync } from 'expo-sqlite'
import * as schema from './schema'

const expoDb = openDatabaseSync('sproutpal.db')
export const db = drizzle(expoDb, { schema })
