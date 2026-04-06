/**
 * SproutPal — Batch Status Manager
 * Handles automatic status transitions and missed rinse detection
 */

import { db } from '@/db/client'
import { batches, dailyLogs } from '@/db/schema'
import { eq, and, desc, ne } from 'drizzle-orm'

export interface BatchStatusInfo {
  batchId: string
  status: string
  missedRinse: boolean
  hoursOverdue: number
  shouldTransition: string | null
}

const TWO_HOURS_MS = 2 * 60 * 60 * 1000
const SIX_HOURS_MS = 6 * 60 * 60 * 1000

/**
 * Check and update batch statuses.
 * - Transitions soaking → growing when soak time has elapsed
 * - Transitions growing → ready when target harvest reached
 * - Detects missed rinses (2h+ and 6h+ overdue)
 */
export async function checkBatchStatuses(): Promise<BatchStatusInfo[]> {
  const now = Date.now()
  const results: BatchStatusInfo[] = []

  const activeBatches = await db.select().from(batches)
    .where(and(
      ne(batches.status, 'harvested'),
      ne(batches.status, 'discarded'),
    ))

  for (const batch of activeBatches) {
    let shouldTransition: string | null = null

    // Auto-transition soaking → growing
    if (batch.status === 'soaking' && now >= batch.jarStartAt) {
      shouldTransition = 'growing'
      await db.update(batches)
        .set({ status: 'growing', updatedAt: now })
        .where(eq(batches.id, batch.id))
    }

    // Auto-transition growing → ready when target harvest reached
    if (batch.status === 'growing' && now >= batch.targetHarvestAt) {
      shouldTransition = 'ready'
      await db.update(batches)
        .set({ status: 'ready', updatedAt: now })
        .where(eq(batches.id, batch.id))
    }

    // Check missed rinse for active growing batches
    let missedRinse = false
    let hoursOverdue = 0

    if (batch.status === 'growing' || (shouldTransition === 'growing')) {
      const [lastRinse] = await db.select().from(dailyLogs)
        .where(and(
          eq(dailyLogs.batchId, batch.id),
          eq(dailyLogs.logType, 'rinse'),
        ))
        .orderBy(desc(dailyLogs.loggedAt))
        .limit(1)

      if (lastRinse) {
        const elapsed = now - lastRinse.loggedAt
        if (elapsed > TWO_HOURS_MS) {
          missedRinse = true
          hoursOverdue = Math.floor(elapsed / 3600000)
        }
      } else {
        // No rinses logged yet — check time since jar start
        const sinceJar = now - batch.jarStartAt
        if (sinceJar > SIX_HOURS_MS) {
          missedRinse = true
          hoursOverdue = Math.floor(sinceJar / 3600000)
        }
      }
    }

    results.push({
      batchId: batch.id,
      status: shouldTransition ?? batch.status,
      missedRinse,
      hoursOverdue,
      shouldTransition,
    })
  }

  return results
}

/**
 * Get the time of the next scheduled rinse based on current time and rinse schedule.
 */
export function getNextRinseTime(rinseTimes: string[]): { time: string; msUntil: number } {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const parsed = rinseTimes.map(t => {
    const [h, m] = t.split(':').map(Number)
    return { time: t, minutes: h * 60 + m }
  }).sort((a, b) => a.minutes - b.minutes)

  // Find next rinse time today
  const next = parsed.find(p => p.minutes > currentMinutes)
  if (next) {
    return {
      time: next.time,
      msUntil: (next.minutes - currentMinutes) * 60000,
    }
  }

  // Wrap to first rinse tomorrow
  const first = parsed[0]
  const minutesUntil = (24 * 60 - currentMinutes) + first.minutes
  return {
    time: first.time,
    msUntil: minutesUntil * 60000,
  }
}
