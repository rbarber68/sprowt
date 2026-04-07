/**
 * SproutPal — Achievement System
 * XP, badges, streaks, and game-show milestones
 */

export type AchievementId =
  | 'first_batch' | 'first_harvest' | 'first_rinse'
  | 'streak_3' | 'streak_7' | 'streak_14' | 'streak_30'
  | 'yield_5x' | 'yield_7x' | 'yield_10x'
  | 'batches_5' | 'batches_10' | 'batches_25'
  | 'harvests_3' | 'harvests_10' | 'harvests_25'
  | 'all_types' | 'legendary_char'
  | 'recipe_tried' | 'photo_all_stages'
  | 'speed_harvest' | 'perfect_rating'

export interface Achievement {
  id: AchievementId
  title: string
  description: string
  emoji: string
  xp: number
  category: 'milestone' | 'streak' | 'performance' | 'collection' | 'special'
  genieAnnouncement: string
}

export const ACHIEVEMENTS: Achievement[] = [
  // Milestones
  {
    id: 'first_batch', title: 'Sprout Rookie', description: 'Start your first batch',
    emoji: '\ud83c\udf31', xp: 10, category: 'milestone',
    genieAnnouncement: 'AND WE HAVE A NEW CONTESTANT! Welcome to The Great Sprout-Off!',
  },
  {
    id: 'first_rinse', title: 'First Splash', description: 'Log your first rinse',
    emoji: '\ud83d\udca7', xp: 5, category: 'milestone',
    genieAnnouncement: 'The rookie makes their FIRST RINSE! The crowd goes mild!',
  },
  {
    id: 'first_harvest', title: 'First Harvest', description: 'Complete your first harvest',
    emoji: '\ud83c\udf89', xp: 25, category: 'milestone',
    genieAnnouncement: 'LADIES AND GENTLEMEN, we have our FIRST HARVEST! A star is born!',
  },

  // Streaks
  {
    id: 'streak_3', title: 'Consistent Grower', description: '3-day rinse streak',
    emoji: '\ud83d\udd25', xp: 15, category: 'streak',
    genieAnnouncement: 'THREE DAYS IN A ROW! This contestant means BUSINESS!',
  },
  {
    id: 'streak_7', title: 'Week Warrior', description: '7-day rinse streak',
    emoji: '\u26a1', xp: 30, category: 'streak',
    genieAnnouncement: 'A FULL WEEK without missing a rinse! The dedication is UNREAL!',
  },
  {
    id: 'streak_14', title: 'Fortnight Fighter', description: '14-day rinse streak',
    emoji: '\ud83d\udcaa', xp: 50, category: 'streak',
    genieAnnouncement: 'TWO WEEKS of perfect rinsing! This is what CHAMPIONS look like!',
  },
  {
    id: 'streak_30', title: 'Monthly Master', description: '30-day rinse streak',
    emoji: '\ud83c\udfc6', xp: 100, category: 'streak',
    genieAnnouncement: 'THIRTY DAYS! An ENTIRE MONTH! We are witnessing GREATNESS, folks!',
  },

  // Performance
  {
    id: 'yield_5x', title: 'Good Yield', description: 'Achieve 5x yield ratio',
    emoji: '\ud83d\udcc8', xp: 20, category: 'performance',
    genieAnnouncement: 'FIVE TIMES the seed weight! That is a SOLID yield, contestant!',
  },
  {
    id: 'yield_7x', title: 'Great Yield', description: 'Achieve 7x yield ratio',
    emoji: '\ud83d\ude80', xp: 40, category: 'performance',
    genieAnnouncement: 'SEVEN X! We are entering the ELITE yield zone! Incredible!',
  },
  {
    id: 'yield_10x', title: 'Legendary Yield', description: 'Achieve 10x yield ratio',
    emoji: '\ud83d\udc51', xp: 75, category: 'performance',
    genieAnnouncement: 'TEN TIMES YIELD?! That is RECORD-BREAKING! Someone call the sprout hall of fame!',
  },

  // Collection
  {
    id: 'batches_5', title: 'Growing Collection', description: 'Start 5 batches',
    emoji: '\ud83e\udeb4', xp: 20, category: 'collection',
    genieAnnouncement: 'Five batches and counting! This farm is EXPANDING!',
  },
  {
    id: 'batches_10', title: 'Batch Master', description: 'Start 10 batches',
    emoji: '\ud83c\udf3e', xp: 40, category: 'collection',
    genieAnnouncement: 'TEN BATCHES! We have a certified SPROUT FARMER in the house!',
  },
  {
    id: 'batches_25', title: 'Sprout Legend', description: 'Start 25 batches',
    emoji: '\ud83c\udf1f', xp: 100, category: 'collection',
    genieAnnouncement: 'TWENTY-FIVE BATCHES! This contestant is now a SPROUT LEGEND!',
  },
  {
    id: 'harvests_3', title: 'Triple Crown', description: 'Harvest 3 batches',
    emoji: '\ud83e\udd47', xp: 30, category: 'collection',
    genieAnnouncement: 'The TRIPLE CROWN! Three successful harvests! The momentum is building!',
  },
  {
    id: 'harvests_10', title: 'Harvest Hero', description: 'Harvest 10 batches',
    emoji: '\ud83c\udfc5', xp: 50, category: 'collection',
    genieAnnouncement: 'TEN HARVESTS! This is what a professional sprout operation looks like!',
  },
  {
    id: 'harvests_25', title: 'Hall of Fame', description: 'Harvest 25 batches',
    emoji: '\ud83c\udfc6', xp: 150, category: 'collection',
    genieAnnouncement: 'TWENTY-FIVE HARVESTS! Ladies and gentlemen, a HALL OF FAMER!',
  },
  {
    id: 'all_types', title: 'Variety King', description: 'Grow all 9 jar sprout types',
    emoji: '\ud83c\udf08', xp: 75, category: 'collection',
    genieAnnouncement: 'Every single jar sprout type! This contestant has RANGE!',
  },

  // Special
  {
    id: 'legendary_char', title: 'Lucky Roll', description: 'Get a Legendary character',
    emoji: '\u2728', xp: 50, category: 'special',
    genieAnnouncement: 'A LEGENDARY CHARACTER! The odds were 3%! INCREDIBLE luck!',
  },
  {
    id: 'recipe_tried', title: 'Home Chef', description: 'View a recipe after harvest',
    emoji: '\ud83c\udf73', xp: 10, category: 'special',
    genieAnnouncement: 'From jar to kitchen! This contestant HONORS their crop!',
  },
  {
    id: 'photo_all_stages', title: 'Photographer', description: 'Take photos at all 4 growth stages',
    emoji: '\ud83d\udcf8', xp: 25, category: 'special',
    genieAnnouncement: 'A complete photo journal! The memories are PRESERVED!',
  },
  {
    id: 'speed_harvest', title: 'Speed Grower', description: 'Harvest a batch in under 3 days',
    emoji: '\u23f1\ufe0f', xp: 30, category: 'special',
    genieAnnouncement: 'Under THREE DAYS to harvest?! That is SPEED GROWING at its finest!',
  },
  {
    id: 'perfect_rating', title: 'Perfect Batch', description: 'Rate a batch 5 stars',
    emoji: '\u2b50', xp: 15, category: 'special',
    genieAnnouncement: 'FIVE STARS! A PERFECT score! This batch was FLAWLESS!',
  },
]

// XP Level thresholds
export const LEVELS = [
  { level: 1, title: 'Sprout Seedling',    minXp: 0,    emoji: '\ud83c\udf31' },
  { level: 2, title: 'Sprout Apprentice',  minXp: 25,   emoji: '\ud83c\udf3f' },
  { level: 3, title: 'Green Thumb',        minXp: 75,   emoji: '\ud83e\udeb4' },
  { level: 4, title: 'Sprout Farmer',      minXp: 150,  emoji: '\ud83c\udf3e' },
  { level: 5, title: 'Harvest Master',     minXp: 300,  emoji: '\ud83c\udfc5' },
  { level: 6, title: 'Sprout Champion',    minXp: 500,  emoji: '\ud83c\udfc6' },
  { level: 7, title: 'Sprout Legend',      minXp: 750,  emoji: '\ud83c\udf1f' },
  { level: 8, title: 'Grand Master',       minXp: 1000, emoji: '\ud83d\udc51' },
]

export function getLevel(xp: number) {
  let current = LEVELS[0]
  for (const level of LEVELS) {
    if (xp >= level.minXp) current = level
    else break
  }
  const nextLevel = LEVELS.find(l => l.minXp > xp) ?? null
  const xpToNext = nextLevel ? nextLevel.minXp - xp : 0
  const progressToNext = nextLevel ? (xp - current.minXp) / (nextLevel.minXp - current.minXp) : 1
  return { ...current, xp, xpToNext, nextLevel, progressToNext }
}

export function getAchievement(id: AchievementId): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id)
}
