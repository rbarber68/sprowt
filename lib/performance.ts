/**
 * SproutPal — Performance Analytics
 * Yield ratio queries, combo stats, trend computation
 */

import { db } from '@/db/client'
import { batches, beanTypes, containers } from '@/db/schema'
import { eq, and, desc, isNotNull } from 'drizzle-orm'

export interface ComboStats {
  beanTypeId: string
  beanName: string
  beanEmoji: string
  containerId: string
  containerName: string
  avgYieldRatio: number
  avgFillPct: number
  avgRating: number
  batchCount: number
}

export interface PerformanceSummary {
  bestCombo: ComboStats | null
  mostConsistent: ComboStats | null
  totalTrackedBatches: number
  combos: ComboStats[]
}

export async function getPerformanceSummary(): Promise<PerformanceSummary> {
  // Get all harvested batches with yield data
  const rows = await db.select({
    beanTypeId: batches.beanTypeId,
    beanName: beanTypes.name,
    beanEmoji: beanTypes.emoji,
    containerId: batches.containerId,
    containerName: containers.name,
    yieldRatio: batches.yieldRatio,
    fillPct: batches.containerFillPct,
    rating: batches.userRating,
  })
    .from(batches)
    .innerJoin(beanTypes, eq(batches.beanTypeId, beanTypes.id))
    .innerJoin(containers, eq(batches.containerId, containers.id))
    .where(and(
      eq(batches.status, 'harvested'),
      isNotNull(batches.yieldRatio),
    ))
    .orderBy(desc(batches.actualHarvestAt))

  if (rows.length === 0) {
    return { bestCombo: null, mostConsistent: null, totalTrackedBatches: 0, combos: [] }
  }

  // Group by sprout+container combo
  const comboMap = new Map<string, {
    beanTypeId: string; beanName: string; beanEmoji: string;
    containerId: string; containerName: string;
    yields: number[]; fills: number[]; ratings: number[];
  }>()

  for (const row of rows) {
    if (!row.containerId || !row.yieldRatio) continue
    const key = `${row.beanTypeId}::${row.containerId}`
    if (!comboMap.has(key)) {
      comboMap.set(key, {
        beanTypeId: row.beanTypeId,
        beanName: row.beanName,
        beanEmoji: row.beanEmoji,
        containerId: row.containerId!,
        containerName: row.containerName,
        yields: [], fills: [], ratings: [],
      })
    }
    const combo = comboMap.get(key)!
    combo.yields.push(row.yieldRatio)
    if (row.fillPct) combo.fills.push(row.fillPct)
    if (row.rating) combo.ratings.push(row.rating)
  }

  const combos: ComboStats[] = Array.from(comboMap.values()).map(c => ({
    beanTypeId: c.beanTypeId,
    beanName: c.beanName,
    beanEmoji: c.beanEmoji,
    containerId: c.containerId,
    containerName: c.containerName,
    avgYieldRatio: c.yields.reduce((a, b) => a + b, 0) / c.yields.length,
    avgFillPct: c.fills.length > 0 ? c.fills.reduce((a, b) => a + b, 0) / c.fills.length : 0,
    avgRating: c.ratings.length > 0 ? c.ratings.reduce((a, b) => a + b, 0) / c.ratings.length : 0,
    batchCount: c.yields.length,
  }))

  // Sort by yield ratio descending
  combos.sort((a, b) => b.avgYieldRatio - a.avgYieldRatio)

  // Most consistent = lowest std dev in yield ratio (min 2 batches)
  let mostConsistent: ComboStats | null = null
  let lowestVariance = Infinity
  for (const c of Array.from(comboMap.values())) {
    if (c.yields.length < 2) continue
    const mean = c.yields.reduce((a, b) => a + b, 0) / c.yields.length
    const variance = c.yields.reduce((sum, y) => sum + (y - mean) ** 2, 0) / c.yields.length
    if (variance < lowestVariance) {
      lowestVariance = variance
      mostConsistent = combos.find(x => x.beanTypeId === c.beanTypeId && x.containerId === c.containerId) ?? null
    }
  }

  return {
    bestCombo: combos[0] ?? null,
    mostConsistent,
    totalTrackedBatches: rows.length,
    combos,
  }
}

export async function getComboHistory(beanTypeId: string, containerId: string) {
  return db.select().from(batches)
    .where(and(
      eq(batches.beanTypeId, beanTypeId),
      eq(batches.containerId, containerId),
      eq(batches.status, 'harvested'),
    ))
    .orderBy(desc(batches.actualHarvestAt))
}

export async function getYieldHint(beanTypeId: string, containerId: string): Promise<string | null> {
  const rows = await db.select({ yieldRatio: batches.yieldRatio })
    .from(batches)
    .where(and(
      eq(batches.beanTypeId, beanTypeId),
      eq(batches.containerId, containerId),
      eq(batches.status, 'harvested'),
      isNotNull(batches.yieldRatio),
    ))

  if (rows.length < 2) return null
  const avg = rows.reduce((sum, r) => sum + (r.yieldRatio ?? 0), 0) / rows.length
  return `Your avg yield: ${avg.toFixed(1)}x (${rows.length} batches)`
}
