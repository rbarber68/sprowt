import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native'
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
      <View style={{ flex: 1, backgroundColor: '#EAF3DE', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 72, marginBottom: 16 }}>🌱</Text>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#27500A', marginBottom: 8 }}>Your Farm is Empty</Text>
        <Text style={{ fontSize: 16, color: '#3B6D11', textAlign: 'center', marginBottom: 32 }}>
          Start your first batch to begin growing!
        </Text>
        <Link href="/batch/new" asChild>
          <TouchableOpacity activeOpacity={0.7} style={{ backgroundColor: '#3B6D11', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 }}>
            <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 18 }}>Start Your First Batch</Text>
          </TouchableOpacity>
        </Link>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
        <View>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#27500A' }}>
            {viewMode === 'fun' ? 'Your sprout crew' : 'Dashboard'}
          </Text>
          <Text style={{ fontSize: 12, color: '#9ca3af' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {' · '}{activeBatches.length} active
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}
          onPress={toggleViewMode}
        >
          <Text style={{ fontSize: 12, color: '#4b5563' }}>{viewMode === 'fun' ? 'Business' : 'Fun'}</Text>
        </TouchableOpacity>
      </View>

      {/* Notification permission denied banner */}
      {notifDenied && activeBatches.length > 0 && (
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ marginHorizontal: 16, marginBottom: 8, backgroundColor: '#FAEEDA', borderWidth: 1, borderColor: '#EF9F27', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center' }}
          onPress={() => Linking.openSettings()}
        >
          <Text style={{ color: '#b45309', fontSize: 14, flex: 1 }}>
            Notifications are off. Tap to enable rinse reminders.
          </Text>
          <Text style={{ color: '#d97706', fontSize: 12, marginLeft: 8 }}>Settings {'\u203a'}</Text>
        </TouchableOpacity>
      )}

      {viewMode === 'fun' ? (
        <FunView batches={batchData} gemmaTip={gemmaTip} onOpenGenie={() => setShowGenie(true)} />
      ) : (
        <BusinessView batches={batchData} />
      )}

      {/* FAB */}
      <TouchableOpacity
        activeOpacity={0.7}
        style={{ position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#3B6D11', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 }}
        onPress={() => router.push('/batch/new')}
      >
        <Text style={{ color: '#ffffff', fontSize: 24 }}>+</Text>
      </TouchableOpacity>

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
    <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
      {/* Batch cards - full width */}
      {batches.map(batch => (
        <BatchCardFun
          key={batch.id}
          batch={batch}
          onPress={() => router.push({ pathname: '/batch/[id]', params: { id: batch.id } })}
          onRinseLog={() => router.push({ pathname: '/batch/[id]', params: { id: batch.id } })}
        />
      ))}

      {/* Gemma bubble */}
      <GemmaBubble
        message={gemmaTip ?? undefined}
        characterName={urgentBatch?.characterName}
        characterEmoji={urgentBatch?.characterEmoji}
        onPress={onOpenGenie}
      />

      {/* Today's reminders */}
      <View style={{ marginTop: 8, marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: '500', color: '#6b7280', marginBottom: 8 }}>Today's schedule</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {['7:00 AM', '3:00 PM', '11:00 PM'].map(time => (
            <View key={time} style={{ backgroundColor: '#EAF3DE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
              <Text style={{ fontSize: 12, color: '#3B6D11' }}>{time} rinse</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  )
}

function BusinessView({ batches }: { batches: BatchDisplay[] }) {
  // Metrics
  const readyCount = batches.filter(b => b.status === 'ready').length
  const needRinse = batches.filter(b => b.isOverdue).length

  return (
    <ScrollView style={{ flex: 1 }}>
      {/* Metrics strip */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 16 }}>
        <MetricCard label="Active" value={String(batches.length)} color="sprout" />
        <MetricCard label="Ready" value={String(readyCount)} color="harvest" />
        <MetricCard label="Need rinse" value={String(needRinse)} color="alert" />
      </View>

      {/* Batch rows */}
      <View style={{ backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
        {batches.map(batch => (
          <BatchCardBusiness
            key={batch.id}
            batch={batch}
            onPress={() => router.push({ pathname: '/batch/[id]', params: { id: batch.id } })}
          />
        ))}
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  )
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  const bgMap: Record<string, string> = {
    sprout: '#EAF3DE',
    harvest: '#EAF3DE',
    alert: '#FAECE7',
  }
  const textMap: Record<string, string> = {
    sprout: '#3B6D11',
    harvest: '#3B6D11',
    alert: '#993C1D',
  }

  return (
    <View style={{ flex: 1, backgroundColor: bgMap[color], borderRadius: 12, padding: 12, alignItems: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: textMap[color] }}>{value}</Text>
      <Text style={{ fontSize: 12, color: '#6b7280' }}>{label}</Text>
    </View>
  )
}
