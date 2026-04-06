/**
 * SproutPal — Database Seeder
 * Seeds bean types and default containers on first launch
 */

import { db } from '@/db/client'
import { beanTypes } from '@/db/schema'
import { SPROUT_TYPES } from '@/data/sproutTypes'
import { seedContainersIfNeeded } from './containers'
import { count } from 'drizzle-orm'
import { Platform } from 'react-native'

/**
 * Replace non-ASCII chars that break expo-sqlite web JSON serialization.
 */
function webSafe(str: string): string {
  if (Platform.OS !== 'web') return str
  // Replace common unicode with ASCII equivalents
  return str
    .replace(/\u2014/g, '--')
    .replace(/\u2013/g, '-')
    .replace(/\u00b0/g, ' deg')
    .replace(/\u00d7/g, 'x')
    .replace(/\u2019/g, "'")
    .replace(/\u2018/g, "'")
    .replace(/\u00e9/g, 'e')
    .replace(/\u00bd/g, '1/2')
    .replace(/\u00bc/g, '1/4')
}

/**
 * Convert emoji to a text code for web storage (emoji breaks JSON serializer).
 * On native, keeps the actual emoji.
 */
function safeEmoji(emoji: string): string {
  if (Platform.OS !== 'web') return emoji
  // Store as :emoji_name: format on web
  const map: Record<string, string> = {
    '\ud83e\udd66': ':broccoli:',
    '\ud83c\udf3f': ':herb:',
    '\ud83e\udeb8': ':beans:',
    '\ud83c\udf31': ':seedling:',
    '\ud83c\udf3e': ':wheat:',
    '\ud83e\uded1': ':pea:',
    '\ud83c\udf3b': ':sunflower:',
    '\ud83c\udf38': ':flower:',
  }
  return map[emoji] ?? emoji.codePointAt(0)?.toString(16) ?? emoji
}

export async function seedDefaultsIfNeeded() {
  try {
    const [{ value }] = await db.select({ value: count() }).from(beanTypes)
    if (value === 0) {
      for (const sprout of SPROUT_TYPES) {
        await db.insert(beanTypes).values({
          id: sprout.id,
          name: sprout.name,
          emoji: safeEmoji(sprout.emoji),
          soakHours: sprout.soakHours,
          growDays: sprout.growDays,
          rinsesPerDay: sprout.rinsesPerDay,
          minTempF: sprout.minTempF,
          maxTempF: sprout.maxTempF,
          lightPreference: sprout.lightPreference,
          difficulty: sprout.difficulty,
          notes: webSafe(sprout.notes),
          sulforaphaneRich: sprout.sulforaphaneRich,
          seedAmountGrams: sprout.seedAmountGrams,
        })
      }
      console.log(`Seeded ${SPROUT_TYPES.length} bean types`)
    }
  } catch (e) {
    console.warn('Seed failed (may be web serialization issue):', e)
    // On web, seeding may fail due to JSON serialization — app still works
    // without seed data (user creates batches manually)
  }

  // Seed default containers
  try {
    await seedContainersIfNeeded()
  } catch (e) {
    console.warn('Container seed failed:', e)
  }
}
