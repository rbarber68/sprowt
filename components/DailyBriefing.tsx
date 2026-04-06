/**
 * SproutPal — Daily Briefing Popup
 * Full dashboard: farm status, schedule, Genie tip, recipe of the day, streaks, character quote
 */

import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native'
import { useState, useEffect } from 'react'
import { router } from 'expo-router'
import { db } from '@/db/client'
import { batches, beanTypes, characters, dailyLogs } from '@/db/schema'
import { eq, ne, and, desc, gte } from 'drizzle-orm'
import { SPROUT_TYPES } from '@/data/sproutTypes'
import { RECIPES } from '@/data/recipes'
import { getKVStore, setKVStore, KV_KEYS } from '@/lib/kvstore'
import { CharacterAvatar } from './CharacterAvatar'

interface DailyBriefingProps {
  visible: boolean
  onDismiss: () => void
}

interface BriefingData {
  activeBatches: { name: string; beanName: string; beanEmoji: string; status: string; dayNumber: number; totalDays: number; faceColor: string; eyeColor: string; eyeShape: string; mouth: string; accessoryEmoji: string; personality: string }[]
  readyCount: number
  needsRinseToday: number
  todaySchedule: { time: string; label: string; emoji: string }[]
  recipeOfDay: { title: string; sproutName: string; prepMinutes: number; description: string } | null
  streak: number
  totalHarvested: number
  genieTip: string
  characterQuote: { name: string; quote: string; personality: string } | null
}

export function DailyBriefing({ visible, onDismiss }: DailyBriefingProps) {
  const [data, setData] = useState<BriefingData | null>(null)

  useEffect(() => {
    if (visible) loadBriefing().then(setData)
  }, [visible])

  if (!visible || !data) return null

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onDismiss}>
      <View style={{ flex: 1, backgroundColor: '#173404' }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Header */}
          <View style={{ paddingHorizontal: 24, paddingTop: 48, paddingBottom: 20 }}>
            <Text style={{ fontSize: 14, color: '#639922', textTransform: 'uppercase', letterSpacing: 2 }}>Daily Briefing</Text>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff', marginTop: 4 }}>{greeting}! {'\u2600\ufe0f'}</Text>
            <Text style={{ fontSize: 14, color: '#97C459', marginTop: 2 }}>{dateStr}</Text>
          </View>

          {/* Farm Status Cards */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 }}>
            <View style={{ flex: 1, backgroundColor: '#27500A', borderRadius: 16, padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#97C459' }}>{data.activeBatches.length}</Text>
              <Text style={{ fontSize: 11, color: '#639922', marginTop: 2 }}>Active</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: data.readyCount > 0 ? '#3B6D11' : '#27500A', borderRadius: 16, padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: data.readyCount > 0 ? '#C0DD97' : '#639922' }}>{data.readyCount}</Text>
              <Text style={{ fontSize: 11, color: '#639922', marginTop: 2 }}>Ready {'\ud83c\udf89'}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#27500A', borderRadius: 16, padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FAC775' }}>{data.totalHarvested}</Text>
              <Text style={{ fontSize: 11, color: '#639922', marginTop: 2 }}>Harvested</Text>
            </View>
          </View>

          {/* Active Batches */}
          {data.activeBatches.length > 0 && (
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
              <Text style={{ fontSize: 11, color: '#639922', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Your Contestants</Text>
              {data.activeBatches.map((b, i) => {
                const progress = Math.min(b.dayNumber / b.totalDays, 1)
                const daysLeft = Math.max(0, b.totalDays - b.dayNumber)
                return (
                  <View key={i} style={{ backgroundColor: '#27500A', borderRadius: 14, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                    <CharacterAvatar faceColor={b.faceColor} eyeColor={b.eyeColor} eyeShape={b.eyeShape} mouth={b.mouth} accessoryEmoji={b.accessoryEmoji} size={40} animation="none" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{b.name}</Text>
                      <Text style={{ color: '#639922', fontSize: 11 }}>{b.beanEmoji} {b.beanName} {'\u00b7'} Day {b.dayNumber}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <View style={{ width: 48, height: 4, backgroundColor: '#173404', borderRadius: 2 }}>
                        <View style={{ width: `${progress * 100}%`, height: 4, backgroundColor: '#97C459', borderRadius: 2 }} />
                      </View>
                      <Text style={{ color: '#639922', fontSize: 10, marginTop: 3 }}>
                        {b.status === 'ready' ? 'HARVEST!' : b.status === 'soaking' ? 'Soaking' : `${daysLeft}d left`}
                      </Text>
                    </View>
                  </View>
                )
              })}
            </View>
          )}

          {/* Today's Schedule */}
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <Text style={{ fontSize: 11, color: '#639922', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Today's Schedule</Text>
            <View style={{ backgroundColor: '#27500A', borderRadius: 14, overflow: 'hidden' }}>
              {data.todaySchedule.map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: i < data.todaySchedule.length - 1 ? 1 : 0, borderBottomColor: '#173404' }}>
                  <Text style={{ fontSize: 18, marginRight: 12 }}>{item.emoji}</Text>
                  <Text style={{ color: '#C0DD97', flex: 1, fontSize: 14 }}>{item.label}</Text>
                  <Text style={{ color: '#639922', fontSize: 13 }}>{item.time}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Genie Tip */}
          <View style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: '#0C447C', borderRadius: 14, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 18, marginRight: 8 }}>{'\ud83e\uddde'}</Text>
              <Text style={{ color: '#85B7EB', fontWeight: '600', fontSize: 13 }}>Genie's Tip of the Day</Text>
            </View>
            <Text style={{ color: '#B5D4F4', fontSize: 14, lineHeight: 20 }}>{data.genieTip}</Text>
          </View>

          {/* Recipe of the Day */}
          {data.recipeOfDay && (
            <View style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: '#27500A', borderRadius: 14, padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 18, marginRight: 8 }}>{'\ud83c\udf73'}</Text>
                <Text style={{ color: '#FAC775', fontWeight: '600', fontSize: 13 }}>Recipe of the Day</Text>
              </View>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{data.recipeOfDay.title}</Text>
              <Text style={{ color: '#97C459', fontSize: 12, marginTop: 2 }}>{data.recipeOfDay.sproutName} {'\u00b7'} {data.recipeOfDay.prepMinutes} min</Text>
              <Text style={{ color: '#C0DD97', fontSize: 13, marginTop: 6, lineHeight: 19 }}>{data.recipeOfDay.description}</Text>
            </View>
          )}

          {/* Streak + Character Quote */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 }}>
            {/* Streak */}
            <View style={{ flex: 1, backgroundColor: '#27500A', borderRadius: 14, padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 32 }}>{data.streak > 0 ? '\ud83d\udd25' : '\ud83c\udf31'}</Text>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20, marginTop: 4 }}>{data.streak}</Text>
              <Text style={{ color: '#639922', fontSize: 11 }}>Day Streak</Text>
            </View>

            {/* Character quote */}
            {data.characterQuote && (
              <View style={{ flex: 2, backgroundColor: '#27500A', borderRadius: 14, padding: 16 }}>
                <Text style={{ color: '#639922', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Quote of the Day</Text>
                <Text style={{ color: '#C0DD97', fontSize: 13, fontStyle: 'italic', lineHeight: 19 }}>
                  "{data.characterQuote.quote}"
                </Text>
                <Text style={{ color: '#639922', fontSize: 11, marginTop: 4 }}>{'\u2014'} {data.characterQuote.name}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Dismiss button */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12 }}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onDismiss}
            style={{ backgroundColor: '#97C459', paddingVertical: 16, borderRadius: 16, alignItems: 'center',
              shadowColor: '#97C459', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }}
          >
            <Text style={{ color: '#173404', fontWeight: 'bold', fontSize: 18 }}>Let's Go! {'\ud83d\ude80'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

async function loadBriefing(): Promise<BriefingData> {
  const now = Date.now()

  // Active batches
  const activeRows = await db.select({
    name: characters.name,
    beanName: beanTypes.name,
    beanEmoji: beanTypes.emoji,
    beanId: beanTypes.id,
    status: batches.status,
    soakStartAt: batches.soakStartAt,
    soakHours: beanTypes.soakHours,
    growDays: beanTypes.growDays,
    faceColor: characters.faceColor,
    eyeColor: characters.eyeColor,
    eyeShape: characters.eyeShape,
    mouth: characters.mouth,
    accessoryEmoji: characters.accessoryEmoji,
    personality: characters.personality,
    catchphrase: characters.catchphrase,
  })
    .from(batches)
    .innerJoin(characters, eq(batches.characterId, characters.id))
    .innerJoin(beanTypes, eq(batches.beanTypeId, beanTypes.id))
    .where(and(ne(batches.status, 'harvested'), ne(batches.status, 'discarded')))
    .limit(10)

  const activeBatches = activeRows.map(r => {
    const totalDays = Math.ceil((r.soakHours / 24) + r.growDays)
    return {
      name: r.name, beanName: r.beanName, beanEmoji: r.beanEmoji,
      status: r.status, dayNumber: Math.floor((now - r.soakStartAt) / 86400000),
      totalDays, faceColor: r.faceColor, eyeColor: r.eyeColor,
      eyeShape: r.eyeShape, mouth: r.mouth, accessoryEmoji: r.accessoryEmoji,
      personality: r.personality,
    }
  })

  const readyCount = activeBatches.filter(b => b.status === 'ready').length

  // Total harvested
  const harvestedRows = await db.select().from(batches).where(eq(batches.status, 'harvested'))
  const totalHarvested = harvestedRows.length

  // Today's schedule
  const rinseTime1 = getKVStore(KV_KEYS.RINSE_TIME_1) ?? '07:00'
  const rinseTime2 = getKVStore(KV_KEYS.RINSE_TIME_2) ?? '15:00'
  const rinseTime3 = getKVStore(KV_KEYS.RINSE_TIME_3) ?? '23:00'

  const formatTime = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    return `${h > 12 ? h - 12 : h || 12}:${String(m).padStart(2, '0')} ${ampm}`
  }

  const todaySchedule = [
    { time: formatTime(rinseTime1), label: `Morning rinse (${activeBatches.length} batches)`, emoji: '\u2600\ufe0f' },
    { time: formatTime(rinseTime2), label: `Afternoon rinse`, emoji: '\ud83c\udf24\ufe0f' },
    { time: formatTime(rinseTime3), label: `Night rinse`, emoji: '\ud83c\udf19' },
  ]

  if (readyCount > 0) {
    todaySchedule.unshift({ time: 'Now', label: `${readyCount} batch${readyCount > 1 ? 'es' : ''} ready to harvest!`, emoji: '\ud83c\udf89' })
  }

  // Recipe of the day (rotate based on day of year)
  const dayOfYear = Math.floor((now - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const recipeIndex = dayOfYear % RECIPES.length
  const recipe = RECIPES[recipeIndex]
  const sproutData = SPROUT_TYPES.find(s => s.id === recipe.sproutTypeId)

  // Streak — count consecutive days with at least one rinse logged
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let streak = 0
  for (let d = 0; d < 30; d++) {
    const dayStart = today.getTime() - d * 86400000
    const dayEnd = dayStart + 86400000
    const logs = await db.select().from(dailyLogs)
      .where(and(eq(dailyLogs.logType, 'rinse'), gte(dailyLogs.loggedAt, dayStart)))
      .limit(1)
    if (logs.length > 0 && logs[0].loggedAt < dayEnd) {
      streak++
    } else if (d > 0) {
      break
    }
  }

  // Character quote — pick from active batch characters
  let characterQuote = null
  if (activeRows.length > 0) {
    const pick = activeRows[dayOfYear % activeRows.length]
    characterQuote = { name: pick.name, quote: pick.catchphrase, personality: pick.personality }
  }

  // Genie tip
  const tips = [
    "Remember: mustard seed powder on broccoli sprouts boosts sulforaphane 3x! Add it right before eating.",
    "Your sprouts grow fastest between 68-75\u00b0F. Check your room temp at each rinse!",
    "Fuzzy white root hairs are normal \u2014 not mold! Mold looks gray/black and smells off.",
    "Drain thoroughly after each rinse. Standing water is the #1 cause of spoilage.",
    "Lentils are the speed champions \u2014 ready in just 60 hours. Great for impatient growers!",
    "Try mixing radish + broccoli sprouts for a glucosinolate power combo!",
    "Store harvested sprouts in a damp paper towel in the fridge. Good for 5 days.",
    "Track your yields! Knowing your seed-to-harvest ratio helps optimize future batches.",
    "Rotate your sprout types \u2014 different sprouts provide different nutrient profiles.",
    "The colder the rinse water, the crunchier the sprouts. Cold rinses = better texture!",
  ]
  const genieTip = tips[dayOfYear % tips.length]

  return {
    activeBatches,
    readyCount,
    needsRinseToday: activeBatches.filter(b => b.status === 'growing').length,
    todaySchedule,
    recipeOfDay: recipe ? { title: recipe.title, sproutName: sproutData?.name ?? '', prepMinutes: recipe.prepMinutes, description: recipe.description } : null,
    streak,
    totalHarvested,
    genieTip,
    characterQuote,
  }
}

/**
 * Check if daily briefing should show (once per day on first open)
 */
export function shouldShowDailyBriefing(): boolean {
  const today = new Date().toISOString().split('T')[0]
  const lastShown = getKVStore('dailyBriefingLastShown')
  return lastShown !== today
}

export function markDailyBriefingShown(): void {
  const today = new Date().toISOString().split('T')[0]
  setKVStore('dailyBriefingLastShown', today)
}
