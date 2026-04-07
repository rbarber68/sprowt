/**
 * SproutPal — Achievement Tracker
 * Checks conditions and unlocks achievements + awards XP
 */

import { db } from '@/db/client'
import { batches, dailyLogs } from '@/db/schema'
import { eq, and, desc, count } from 'drizzle-orm'
import { getKVStore, setKVStore } from './kvstore'
import { ACHIEVEMENTS, getLevel, type AchievementId } from '@/data/achievements'

const KV_PREFIX = 'achievement_'
const XP_KEY = 'player_xp'

/** Get all unlocked achievement IDs */
export function getUnlockedAchievements(): AchievementId[] {
  const raw = getKVStore('unlocked_achievements')
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

/** Get total XP */
export function getPlayerXp(): number {
  return parseInt(getKVStore(XP_KEY) ?? '0', 10)
}

/** Get player level info */
export function getPlayerLevel() {
  return getLevel(getPlayerXp())
}

/** Unlock an achievement (returns it if newly unlocked, null if already had) */
export function unlockAchievement(id: AchievementId): typeof ACHIEVEMENTS[number] | null {
  const unlocked = getUnlockedAchievements()
  if (unlocked.includes(id)) return null

  const achievement = ACHIEVEMENTS.find(a => a.id === id)
  if (!achievement) return null

  // Save unlock
  unlocked.push(id)
  setKVStore('unlocked_achievements', JSON.stringify(unlocked))

  // Award XP
  const currentXp = getPlayerXp()
  setKVStore(XP_KEY, String(currentXp + achievement.xp))

  return achievement
}

/**
 * Check all achievement conditions against current state.
 * Returns array of newly unlocked achievements.
 */
export async function checkAchievements(): Promise<typeof ACHIEVEMENTS[number][]> {
  const newlyUnlocked: typeof ACHIEVEMENTS[number][] = []

  try {
    // Count batches
    const allBatches = await db.select().from(batches)
    const totalBatches = allBatches.length
    const harvestedBatches = allBatches.filter(b => b.status === 'harvested')
    const totalHarvested = harvestedBatches.length

    // Check milestone achievements
    if (totalBatches >= 1) {
      const a = unlockAchievement('first_batch')
      if (a) newlyUnlocked.push(a)
    }
    if (totalHarvested >= 1) {
      const a = unlockAchievement('first_harvest')
      if (a) newlyUnlocked.push(a)
    }

    // Batch count achievements
    if (totalBatches >= 5) { const a = unlockAchievement('batches_5'); if (a) newlyUnlocked.push(a) }
    if (totalBatches >= 10) { const a = unlockAchievement('batches_10'); if (a) newlyUnlocked.push(a) }
    if (totalBatches >= 25) { const a = unlockAchievement('batches_25'); if (a) newlyUnlocked.push(a) }

    // Harvest count achievements
    if (totalHarvested >= 3) { const a = unlockAchievement('harvests_3'); if (a) newlyUnlocked.push(a) }
    if (totalHarvested >= 10) { const a = unlockAchievement('harvests_10'); if (a) newlyUnlocked.push(a) }
    if (totalHarvested >= 25) { const a = unlockAchievement('harvests_25'); if (a) newlyUnlocked.push(a) }

    // Yield achievements
    for (const b of harvestedBatches) {
      if (b.yieldRatio && b.yieldRatio >= 5) { const a = unlockAchievement('yield_5x'); if (a) newlyUnlocked.push(a) }
      if (b.yieldRatio && b.yieldRatio >= 7) { const a = unlockAchievement('yield_7x'); if (a) newlyUnlocked.push(a) }
      if (b.yieldRatio && b.yieldRatio >= 10) { const a = unlockAchievement('yield_10x'); if (a) newlyUnlocked.push(a) }
    }

    // Perfect rating
    for (const b of harvestedBatches) {
      if (b.userRating === 5) { const a = unlockAchievement('perfect_rating'); if (a) newlyUnlocked.push(a) }
    }

    // Speed harvest (under 3 days)
    for (const b of harvestedBatches) {
      if (b.actualHarvestAt && b.soakStartAt) {
        const days = (b.actualHarvestAt - b.soakStartAt) / 86400000
        if (days < 3) { const a = unlockAchievement('speed_harvest'); if (a) newlyUnlocked.push(a) }
      }
    }

    // Variety — check unique bean types
    const uniqueTypes = new Set(allBatches.map(b => b.beanTypeId))
    if (uniqueTypes.size >= 9) { const a = unlockAchievement('all_types'); if (a) newlyUnlocked.push(a) }

    // Rinse count
    const [rinseResult] = await db.select({ value: count() }).from(dailyLogs)
      .where(eq(dailyLogs.logType, 'rinse'))
    if (rinseResult.value >= 1) { const a = unlockAchievement('first_rinse'); if (a) newlyUnlocked.push(a) }

    // Streak (check consecutive days with rinses)
    const streak = calculateStreak()
    if (streak >= 3) { const a = unlockAchievement('streak_3'); if (a) newlyUnlocked.push(a) }
    if (streak >= 7) { const a = unlockAchievement('streak_7'); if (a) newlyUnlocked.push(a) }
    if (streak >= 14) { const a = unlockAchievement('streak_14'); if (a) newlyUnlocked.push(a) }
    if (streak >= 30) { const a = unlockAchievement('streak_30'); if (a) newlyUnlocked.push(a) }

    // Legendary character check
    for (const b of allBatches) {
      try {
        const chars = await db.select().from(require('@/db/schema').characters)
          .where(eq(require('@/db/schema').characters.id, b.characterId))
        if (chars[0]?.rarity === 'legendary') {
          const a = unlockAchievement('legendary_char')
          if (a) newlyUnlocked.push(a)
        }
      } catch {}
    }
  } catch (e) {
    console.warn('Achievement check failed:', e)
  }

  return newlyUnlocked
}

function calculateStreak(): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let streak = 0

  for (let d = 0; d < 60; d++) {
    const dayStart = today.getTime() - d * 86400000
    const dayEnd = dayStart + 86400000
    const hasRinse = getKVStore(`rinse_day_${new Date(dayStart).toISOString().split('T')[0]}`)
    if (hasRinse === 'true') {
      streak++
    } else if (d > 0) {
      break
    }
  }
  return streak
}

/** Call after each rinse to mark the day */
export function markRinseDay() {
  const today = new Date().toISOString().split('T')[0]
  setKVStore(`rinse_day_${today}`, 'true')
}
