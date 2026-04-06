import { View, Text, Pressable, ScrollView, Linking } from 'react-native'
import { Link, router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import * as Notifications from 'expo-notifications'
import { db } from '@/db/client'
import { batches, characters, beanTypes } from '@/db/schema'
import { eq, ne, desc } from 'drizzle-orm'
import { SPROUT_TYPES } from '@/data/sproutTypes'
import { DISTRESS_MESSAGES, type PersonalityKey } from '@/data/characters'
import { getKVStore, setKVStore, KV_KEYS } from '@/lib/kvstore'
import { checkBatchStatuses, getNextRinseTime, type BatchStatusInfo } from '@/lib/batchStatus'
import { BatchCardFun } from '@/components/BatchCardFun'
import { BatchCardBusiness } from '@/components/BatchCardBusiness'
import { GemmaBubble } from '@/components/GemmaBubble'
import { GenieChat } from '@/components/GenieChat'

type BatchRow = {
  batches: typeof batches.$inferSelect
  characters: typeof characters.$inferSelect
  bean_types: typeof beanTypes.$inferSelect
}

export default function FarmScreen() {
  const [activeBatches, setActiveBatches] = useState<BatchRow[]>([])
  const [statusMap, setStatusMap] = useState<Map<string, BatchStatusInfo>>(new Map())
  const [viewMode, setViewMode] = useState<'fun' | 'business'>('fun')
  const [loading, setLoading] = useState(true)
  const [gemmaTip, setGemmaTip] = useState<string | null>(null)
  const [notifDenied, setNotifDenied] = useState(false)
  const [showGenie, setShowGenie] = useState(false)

  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [])
  )

  const loadData = async () => {
    try {
      const mode = getKVStore(KV_KEYS.VIEW_MODE) as 'fun' | 'business' | null
      if (mode) setViewMode(mode)

      // Check notification permission
      const { status } = await Notifications.getPermissionsAsync()
      setNotifDenied(status !== 'granted')

      // Check and update batch statuses (soaking→growing, growing→ready)
      const statuses = await checkBatchStatuses()
      const map = new Map<string, BatchStatusInfo>()
      for (const s of statuses) map.set(s.batchId, s)
      setStatusMap(map)

      const rows = await db.select().from(batches)
        .innerJoin(characters, eq(batches.characterId, characters.id))
        .innerJoin(beanTypes, eq(batches.beanTypeId, beanTypes.id))
        .where(ne(batches.status, 'harvested'))
        .orderBy(desc(batches.createdAt))

      setActiveBatches(rows.filter(r => r.batches.status !== 'discarded'))

      // Set distress message for most urgent batch
      const overdueStatus = statuses.find(s => s.missedRinse)
      if (overdueStatus) {
        const overdueRow = rows.find(r => r.batches.id === overdueStatus.batchId)
        if (overdueRow) {
          const personality = overdueRow.characters.personality as PersonalityKey
          setGemmaTip(DISTRESS_MESSAGES[personality] ?? null)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleViewMode = () => {
    const next = viewMode === 'fun' ? 'business' : 'fun'
    setViewMode(next)
    setKVStore(KV_KEYS.VIEW_MODE, next)
  }

  const now = Date.now()

  // Compute day numbers and overdue status using statusMap from checkBatchStatuses
  const batchData = activeBatches.map(row => {
    const b = row.batches
    const c = row.characters
    const bt = row.bean_types
    const statusInfo = statusMap.get(b.id)

    const dayNumber = Math.max(0, Math.floor((now - b.soakStartAt) / 86400000))
    const totalDays = Math.ceil((bt.soakHours / 24) + bt.growDays)

    return {
      id: b.id,
      jarLabel: b.jarLabel,
      status: statusInfo?.status ?? b.status,
      beanName: bt.name,
      beanEmoji: bt.emoji,
      characterName: c.name,
      characterEmoji: c.accessoryEmoji,
      faceColor: c.faceColor,
      eyeColor: c.eyeColor,
      eyeShape: c.eyeShape,
      mouth: c.mouth,
      accessoryEmoji: c.accessoryEmoji,
      dayNumber,
      totalDays,
      minTempF: bt.minTempF,
      maxTempF: bt.maxTempF,
      rinsesPerDay: bt.rinsesPerDay,
      isOverdue: statusInfo?.missedRinse ?? false,
    }
  })

  // Empty state
  if (!loading && activeBatches.length === 0) {
    return (
      <View className="flex-1 bg-sprout-50 items-center justify-center p-6">
        <Text className="text-7xl mb-4">🌱</Text>
        <Text className="text-2xl font-bold text-sprout-800 mb-2">Your Farm is Empty</Text>
        <Text className="text-base text-sprout-600 text-center mb-8">
          Start your first batch to begin growing!
        </Text>
        <Link href="/batch/new" asChild>
          <Pressable className="bg-sprout-600 px-8 py-4 rounded-card">
            <Text className="text-white font-bold text-lg">Start Your First Batch</Text>
          </Pressable>
        </Link>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 pt-2 pb-3">
        <View>
          <Text className="text-xl font-bold text-sprout-800">
            {viewMode === 'fun' ? 'Your sprout crew' : 'Dashboard'}
          </Text>
          <Text className="text-xs text-gray-400">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {' · '}{activeBatches.length} active
          </Text>
        </View>
        <Pressable
          className="bg-gray-100 px-3 py-1.5 rounded-chip"
          onPress={toggleViewMode}
        >
          <Text className="text-xs text-gray-600">{viewMode === 'fun' ? 'Business' : 'Fun'}</Text>
        </Pressable>
      </View>

      {/* Notification permission denied banner */}
      {notifDenied && activeBatches.length > 0 && (
        <Pressable
          className="mx-4 mb-2 bg-soak-50 border border-soak-200 rounded-card p-3 flex-row items-center"
          onPress={() => Linking.openSettings()}
        >
          <Text className="text-soak-600 text-sm flex-1">
            Notifications are off. Tap to enable rinse reminders.
          </Text>
          <Text className="text-soak-400 text-xs ml-2">Settings {'\u203a'}</Text>
        </Pressable>
      )}

      {viewMode === 'fun' ? (
        <FunView batches={batchData} gemmaTip={gemmaTip} onOpenGenie={() => setShowGenie(true)} />
      ) : (
        <BusinessView batches={batchData} />
      )}

      {/* FAB */}
      <Pressable
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-sprout-600 items-center justify-center shadow-lg"
        onPress={() => router.push('/batch/new')}
      >
        <Text className="text-white text-2xl">+</Text>
      </Pressable>

      <GenieChat
        visible={showGenie}
        onClose={() => setShowGenie(false)}
        screenContext={{ screen: 'farm' }}
      />
    </View>
  )
}

type BatchDisplay = {
  id: string
  jarLabel: string
  status: string
  beanName: string
  beanEmoji: string
  characterName: string
  characterEmoji: string
  faceColor: string
  eyeColor: string
  eyeShape: string
  mouth: string
  accessoryEmoji: string
  dayNumber: number
  totalDays: number
  minTempF: number
  maxTempF: number
  rinsesPerDay: number
  isOverdue: boolean
}

function FunView({ batches, gemmaTip, onOpenGenie }: { batches: BatchDisplay[]; gemmaTip: string | null; onOpenGenie: () => void }) {
  // Find the most urgent batch for the Gemma bubble
  const urgentBatch = batches.find(b => b.isOverdue) ?? batches.find(b => b.status === 'ready') ?? batches[0]

  return (
    <ScrollView className="flex-1 px-4">
      {/* Batch cards - 2 columns */}
      <View className="flex-row flex-wrap justify-between">
        {batches.map(batch => (
          <View key={batch.id} className="w-[48%]">
            <BatchCardFun
              batch={batch}
              onPress={() => router.push({ pathname: '/batch/[id]', params: { id: batch.id } })}
              onRinseLog={() => router.push({ pathname: '/batch/[id]', params: { id: batch.id } })}
            />
          </View>
        ))}
      </View>

      {/* Gemma bubble */}
      <GemmaBubble
        message={gemmaTip ?? undefined}
        characterName={urgentBatch?.characterName}
        characterEmoji={urgentBatch?.characterEmoji}
        onPress={onOpenGenie}
      />

      {/* Today's reminders */}
      <View className="mt-2 mb-4">
        <Text className="text-sm font-medium text-gray-500 mb-2">Today's schedule</Text>
        <View className="flex-row gap-2">
          {['7:00 AM', '3:00 PM', '11:00 PM'].map(time => (
            <View key={time} className="bg-sprout-50 px-3 py-1.5 rounded-chip">
              <Text className="text-xs text-sprout-600">{time} rinse</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="h-20" />
    </ScrollView>
  )
}

function BusinessView({ batches }: { batches: BatchDisplay[] }) {
  // Metrics
  const readyCount = batches.filter(b => b.status === 'ready').length
  const needRinse = batches.filter(b => b.isOverdue).length

  return (
    <ScrollView className="flex-1">
      {/* Metrics strip */}
      <View className="flex-row px-4 gap-3 mb-4">
        <MetricCard label="Active" value={String(batches.length)} color="sprout" />
        <MetricCard label="Ready" value={String(readyCount)} color="harvest" />
        <MetricCard label="Need rinse" value={String(needRinse)} color="alert" />
      </View>

      {/* Batch rows */}
      <View className="bg-white border-t border-gray-100">
        {batches.map(batch => (
          <BatchCardBusiness
            key={batch.id}
            batch={batch}
            onPress={() => router.push({ pathname: '/batch/[id]', params: { id: batch.id } })}
          />
        ))}
      </View>

      <View className="h-20" />
    </ScrollView>
  )
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  const bgMap: Record<string, string> = {
    sprout: 'bg-sprout-50',
    harvest: 'bg-sprout-50',
    alert: 'bg-alert-50',
  }
  const textMap: Record<string, string> = {
    sprout: 'text-sprout-600',
    harvest: 'text-sprout-600',
    alert: 'text-alert-600',
  }

  return (
    <View className={`flex-1 ${bgMap[color]} rounded-card p-3 items-center`}>
      <Text className={`text-2xl font-bold ${textMap[color]}`}>{value}</Text>
      <Text className="text-xs text-gray-500">{label}</Text>
    </View>
  )
}
