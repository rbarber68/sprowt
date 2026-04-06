/**
 * SproutPal — Database Seeder
 * Seeds bean types and default containers on first launch
 */

import { db } from '@/db/client'
import { beanTypes } from '@/db/schema'
import { SPROUT_TYPES } from '@/data/sproutTypes'
import { seedContainersIfNeeded } from './containers'
import { count } from 'drizzle-orm'

export async function seedDefaultsIfNeeded() {
  // Seed bean types
  const [{ value }] = await db.select({ value: count() }).from(beanTypes)
  if (value === 0) {
    for (const sprout of SPROUT_TYPES) {
      await db.insert(beanTypes).values({
        id: sprout.id,
        name: sprout.name,
        emoji: sprout.emoji,
        soakHours: sprout.soakHours,
        growDays: sprout.growDays,
        rinsesPerDay: sprout.rinsesPerDay,
        minTempF: sprout.minTempF,
        maxTempF: sprout.maxTempF,
        lightPreference: sprout.lightPreference,
        difficulty: sprout.difficulty,
        notes: sprout.notes,
        sulforaphaneRich: sprout.sulforaphaneRich,
        seedAmountGrams: sprout.seedAmountGrams,
      })
    }
    console.log(`Seeded ${SPROUT_TYPES.length} bean types`)
  }

  // Seed default containers
  await seedContainersIfNeeded()
}
