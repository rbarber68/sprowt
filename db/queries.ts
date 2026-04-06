/**
 * SproutPal — Database Query Helpers
 */

import { db } from './client'
import { batches, beanTypes, characters, dailyLogs, seedAdjustments, seedSources } from './schema'
import { eq, desc, and, gte } from 'drizzle-orm'

// Get all active batches with character and bean type joined
export const getActiveBatches = () =>
  db.select().from(batches)
    .innerJoin(characters, eq(batches.characterId, characters.id))
    .innerJoin(beanTypes, eq(batches.beanTypeId, beanTypes.id))
    .where(
      and(
        // Include soaking, growing, ready statuses
      )
    )
    .orderBy(desc(batches.createdAt))

// Get rinse logs for a batch (last 7 days)
export const getRecentRinseLogs = (batchId: string) =>
  db.select().from(dailyLogs)
    .where(and(
      eq(dailyLogs.batchId, batchId),
      eq(dailyLogs.logType, 'rinse'),
      gte(dailyLogs.loggedAt, Date.now() - 7 * 86400 * 1000)
    ))
    .orderBy(desc(dailyLogs.loggedAt))

// Get seed adjustment for a source
export const getSeedAdjustment = (seedSourceId: string) =>
  db.select().from(seedAdjustments)
    .where(eq(seedAdjustments.seedSourceId, seedSourceId))
    .get()

// Archive a batch at harvest
export const harvestBatch = (batchId: string, data: {
  germinationPct: number
  userRating: number
  harvestNotes: string
}) =>
  db.update(batches)
    .set({
      status: 'harvested',
      actualHarvestAt: Date.now(),
      ...data,
      updatedAt: Date.now(),
    })
    .where(eq(batches.id, batchId))

// Get all bean types (for library)
export const getAllBeanTypes = () =>
  db.select().from(beanTypes).orderBy(beanTypes.name)

// Get archived batches
export const getArchivedBatches = () =>
  db.select().from(batches)
    .innerJoin(characters, eq(batches.characterId, characters.id))
    .innerJoin(beanTypes, eq(batches.beanTypeId, beanTypes.id))
    .where(eq(batches.status, 'harvested'))
    .orderBy(desc(batches.actualHarvestAt))
