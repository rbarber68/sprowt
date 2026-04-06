import { View, Text, Pressable, ScrollView } from 'react-native'
import { useFocusEffect, router } from 'expo-router'
import { useState, useCallback } from 'react'
import { db } from '@/db/client'
import { batches, characters, beanTypes } from '@/db/schema'
import { eq, or, desc } from 'drizzle-orm'
import { PerformanceTab } from '@/components/PerformanceTab'
import { GenieChat } from '@/components/GenieChat'

type HistoryRow = {
  batches: typeof batches.$inferSelect
  characters: typeof characters.$inferSelect
  bean_types: typeof beanTypes.$inferSelect
}

export default function HistoryScreen() {
  const [archivedBatches, setArchivedBatches] = useState<HistoryRow[]>([])
  const [tab, setTab] = useState<'history' | 'feedback' | 'performance'>('history')
  const [showGenie, setShowGenie] = useState(false)

  useFocusEffect(
    useCallback(() => {
      loadHistory()
    }, [])
  )

  const loadHistory = async () => {
    const rows = await db.select().from(batches)
      .innerJoin(characters, eq(batches.characterId, characters.id))
      .innerJoin(beanTypes, eq(batches.beanTypeId, beanTypes.id))
      .where(or(eq(batches.status, 'harvested'), eq(batches.status, 'discarded')))
      .orderBy(desc(batches.actualHarvestAt))

    setArchivedBatches(rows)
  }

  return (
    <View className="flex-1 bg-white">
      {/* Tab selector */}
      <View className="flex-row border-b border-gray-200">
        <Pressable
          className={`flex-1 py-3 items-center ${tab === 'history' ? 'border-b-2 border-sprout-600' : ''}`}
          onPress={() => setTab('history')}
        >
          <Text className={tab === 'history' ? 'font-bold text-sprout-600' : 'text-gray-500'}>
            History
          </Text>
        </Pressable>
        <Pressable
          className={`flex-1 py-3 items-center ${tab === 'feedback' ? 'border-b-2 border-sprout-600' : ''}`}
          onPress={() => setTab('feedback')}
        >
          <Text className={tab === 'feedback' ? 'font-bold text-sprout-600' : 'text-gray-500'}>
            Seed Feedback
          </Text>
        </Pressable>
        <Pressable
          className={`flex-1 py-3 items-center ${tab === 'performance' ? 'border-b-2 border-sprout-600' : ''}`}
          onPress={() => setTab('performance')}
        >
          <Text className={tab === 'performance' ? 'font-bold text-sprout-600' : 'text-gray-500'}>
            Performance
          </Text>
        </Pressable>
      </View>

      {tab === 'history' ? (
        <HistoryTab batches={archivedBatches} />
      ) : tab === 'feedback' ? (
        <FeedbackTab batches={archivedBatches} />
      ) : null}

      {tab === 'performance' && (
        <PerformanceTab onOpenGenie={() => setShowGenie(true)} />
      )}

      <GenieChat
        visible={showGenie}
        onClose={() => setShowGenie(false)}
        screenContext={{ screen: 'performance' }}
      />
    </View>
  )
}

function HistoryTab({ batches: archivedBatches }: { batches: HistoryRow[] }) {
  if (archivedBatches.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-5xl mb-4">📋</Text>
        <Text className="text-xl font-bold text-sprout-800 mb-2">No harvest history yet</Text>
        <Text className="text-gray-500 text-center">
          Your harvest archive will appear here after you complete your first batch.
        </Text>
      </View>
    )
  }

  return (
    <ScrollView className="flex-1">
      {archivedBatches.map(row => {
        const b = row.batches
        const c = row.characters
        const bt = row.bean_types

        return (
          <Pressable
            key={b.id}
            className="flex-row items-center px-4 py-3 border-b border-gray-50"
            onPress={() => router.push({ pathname: '/batch/[id]', params: { id: b.id } })}
          >
            <Text className="text-2xl mr-3">{bt.emoji}</Text>
            <View className="flex-1">
              <Text className="font-medium text-sprout-800">{c.name}</Text>
              <Text className="text-xs text-gray-500">
                {bt.name} · {b.jarLabel} · {b.status}
              </Text>
            </View>
            <View className="items-end">
              {b.actualHarvestAt && (
                <Text className="text-xs text-gray-400">
                  {new Date(b.actualHarvestAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              )}
              {b.userRating && (
                <Text className="text-xs text-soak-200">
                  {'★'.repeat(b.userRating)}{'☆'.repeat(5 - b.userRating)}
                </Text>
              )}
              {b.germinationPct !== null && b.germinationPct !== undefined && (
                <Text className="text-xs text-gray-400">{b.germinationPct}% germ</Text>
              )}
            </View>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

function FeedbackTab({ batches: archivedBatches }: { batches: HistoryRow[] }) {
  const harvestedCount = archivedBatches.filter(r => r.batches.status === 'harvested').length

  if (harvestedCount < 3) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-5xl mb-4">📊</Text>
        <Text className="text-xl font-bold text-sprout-800 mb-2">Unlock Adaptive Timing</Text>
        <Text className="text-gray-500 text-center mb-4">
          Log 3 batches to unlock personalized harvest timing.
        </Text>
        {/* Progress indicator */}
        <View className="flex-row gap-2 items-center">
          {[0, 1, 2].map(i => (
            <View
              key={i}
              className={`w-8 h-8 rounded-full items-center justify-center ${
                i < harvestedCount ? 'bg-sprout-400' : 'bg-gray-200'
              }`}
            >
              <Text className={i < harvestedCount ? 'text-white text-sm font-bold' : 'text-gray-400 text-sm'}>
                {i + 1}
              </Text>
            </View>
          ))}
        </View>
        <Text className="text-xs text-gray-400 mt-2">{harvestedCount} of 3 batches completed</Text>
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 p-4">
      <View className="bg-info-50 border border-info-200 rounded-card p-4 mb-4">
        <Text className="text-sm font-medium text-info-600 mb-1">Adaptive Timing Active</Text>
        <Text className="text-sm text-gray-600">
          Your seed profiles are building. Timing adjustments will appear on new batches.
        </Text>
      </View>
      <Text className="text-gray-400 text-center text-sm">
        Detailed seed feedback analysis coming with Gemma integration.
      </Text>
    </ScrollView>
  )
}
