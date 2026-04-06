/**
 * SproutPal — Adaptive Seed Feedback Engine
 * Computes timing adjustments based on completed batch history
 */

import { db } from '@/db/client'
import { seedAdjustments, batches, beanTypes } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function updateSeedAdjustment(seedSourceId: string) {
  // Get all completed batches for this seed source
  const completedBatches = await db.select()
    .from(batches)
    .where(and(
      eq(batches.seedSourceId, seedSourceId),
      eq(batches.status, 'harvested'),
    ))

  if (completedBatches.length < 3) return null

  // Calculate averages
  const avgGermination = completedBatches.reduce((sum, b) => sum + (b.germinationPct ?? 0), 0) / completedBatches.length
  const avgRating = completedBatches.reduce((sum, b) => sum + (b.userRating ?? 0), 0) / completedBatches.length

  const actualGrowDays = completedBatches
    .filter(b => b.actualHarvestAt && b.jarStartAt)
    .map(b => ((b.actualHarvestAt! - b.jarStartAt) / 86400000))

  const avgActualGrowDays = actualGrowDays.length > 0
    ? actualGrowDays.reduce((sum, d) => sum + d, 0) / actualGrowDays.length
    : null

  // Get default grow days for this bean type
  const batch = completedBatches[0]
  const [bean] = await db.select().from(beanTypes).where(eq(beanTypes.id, batch.beanTypeId))
  if (!bean) return null

  const growDayOffset = avgActualGrowDays !== null
    ? avgActualGrowDays - bean.growDays
    : 0

  const now = Date.now()

  // Upsert the adjustment
  const existing = await db.select().from(seedAdjustments)
    .where(eq(seedAdjustments.seedSourceId, seedSourceId))
    .get()

  if (existing) {
    await db.update(seedAdjustments)
      .set({
        batchCount: completedBatches.length,
        avgGerminationPct: avgGermination,
        avgActualGrowDays: avgActualGrowDays,
        growDayOffset: growDayOffset,
        avgUserRating: avgRating,
        updatedAt: now,
      })
      .where(eq(seedAdjustments.id, existing.id))
  }

  return { avgGermination, avgActualGrowDays, growDayOffset, avgRating }
}
