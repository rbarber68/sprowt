import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
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
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* Tab selector */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            borderBottomWidth: tab === 'history' ? 2 : 0,
            borderBottomColor: tab === 'history' ? '#3B6D11' : 'transparent',
          }}
          onPress={() => setTab('history')}
        >
          <Text style={{ fontWeight: tab === 'history' ? 'bold' : '400', color: tab === 'history' ? '#3B6D11' : '#6b7280' }}>
            History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            borderBottomWidth: tab === 'feedback' ? 2 : 0,
            borderBottomColor: tab === 'feedback' ? '#3B6D11' : 'transparent',
          }}
          onPress={() => setTab('feedback')}
        >
          <Text style={{ fontWeight: tab === 'feedback' ? 'bold' : '400', color: tab === 'feedback' ? '#3B6D11' : '#6b7280' }}>
            Seed Feedback
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            borderBottomWidth: tab === 'performance' ? 2 : 0,
            borderBottomColor: tab === 'performance' ? '#3B6D11' : 'transparent',
          }}
          onPress={() => setTab('performance')}
        >
          <Text style={{ fontWeight: tab === 'performance' ? 'bold' : '400', color: tab === 'performance' ? '#3B6D11' : '#6b7280' }}>
            Performance
          </Text>
        </TouchableOpacity>
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>📋</Text>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#27500A', marginBottom: 8 }}>No harvest history yet</Text>
        <Text style={{ color: '#6b7280', textAlign: 'center' }}>
          Your harvest archive will appear here after you complete your first batch.
        </Text>
      </View>
    )
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{}}>
      {archivedBatches.map(row => {
        const b = row.batches
        const c = row.characters
        const bt = row.bean_types

        return (
          <TouchableOpacity
            key={b.id}
            activeOpacity={0.7}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f9fafb' }}
            onPress={() => router.push({ pathname: '/batch/[id]', params: { id: b.id } })}
          >
            <Text style={{ fontSize: 24, marginRight: 12 }}>{bt.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '500', color: '#27500A' }}>{c.name}</Text>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>
                {bt.name} · {b.jarLabel} · {b.status}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              {b.actualHarvestAt && (
                <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                  {new Date(b.actualHarvestAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              )}
              {b.userRating && (
                <Text style={{ fontSize: 12, color: '#EF9F27' }}>
                  {'★'.repeat(b.userRating)}{'☆'.repeat(5 - b.userRating)}
                </Text>
              )}
              {b.germinationPct !== null && b.germinationPct !== undefined && (
                <Text style={{ fontSize: 12, color: '#9ca3af' }}>{b.germinationPct}% germ</Text>
              )}
            </View>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

function FeedbackTab({ batches: archivedBatches }: { batches: HistoryRow[] }) {
  const harvestedCount = archivedBatches.filter(r => r.batches.status === 'harvested').length

  if (harvestedCount < 3) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>📊</Text>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#27500A', marginBottom: 8 }}>Unlock Adaptive Timing</Text>
        <Text style={{ color: '#6b7280', textAlign: 'center', marginBottom: 16 }}>
          Log 3 batches to unlock personalized harvest timing.
        </Text>
        {/* Progress indicator */}
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {[0, 1, 2].map(i => (
            <View
              key={i}
              style={{
                width: 32,
                height: 32,
                borderRadius: 9999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: i < harvestedCount ? '#639922' : '#e5e7eb',
              }}
            >
              <Text style={{ color: i < harvestedCount ? '#ffffff' : '#9ca3af', fontSize: 14, fontWeight: 'bold' }}>
                {i + 1}
              </Text>
            </View>
          ))}
        </View>
        <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>{harvestedCount} of 3 batches completed</Text>
      </View>
    )
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ padding: 16 }}>
      <View style={{ backgroundColor: '#E6F1FB', borderWidth: 1, borderColor: '#85B7EB', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: '500', color: '#185FA5', marginBottom: 4 }}>Adaptive Timing Active</Text>
        <Text style={{ fontSize: 14, color: '#4b5563' }}>
          Your seed profiles are building. Timing adjustments will appear on new batches.
        </Text>
      </View>
      <Text style={{ color: '#9ca3af', textAlign: 'center', fontSize: 14 }}>
        Detailed seed feedback analysis coming with Gemma integration.
      </Text>
    </ScrollView>
  )
}
