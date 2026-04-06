/**
 * SproutPal — Performance Analytics Tab
 * Stats cards, combo table, Genie analysis button
 */

import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useState, useEffect } from 'react'
import { getPerformanceSummary, type PerformanceSummary, type ComboStats } from '@/lib/performance'

interface PerformanceTabProps {
  onOpenGenie: () => void
}

export function PerformanceTab({ onOpenGenie }: PerformanceTabProps) {
  const [data, setData] = useState<PerformanceSummary | null>(null)

  useEffect(() => {
    getPerformanceSummary().then(setData)
  }, [])

  if (!data || data.totalTrackedBatches === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>{'\ud83d\udcca'}</Text>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#27500A', marginBottom: 8 }}>No yield data yet</Text>
        <Text style={{ color: '#6b7280', textAlign: 'center' }}>
          Complete a batch with yield tracking to see performance analytics.
        </Text>
      </View>
    )
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      {/* Stats cards */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <View style={{ flex: 1, backgroundColor: '#EAF3DE', borderRadius: 12, padding: 12, alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#3B6D11' }}>{data.totalTrackedBatches}</Text>
          <Text style={{ fontSize: 12, color: '#6b7280' }}>Tracked</Text>
        </View>
        {data.bestCombo && (
          <View style={{ flex: 1, backgroundColor: '#FAEEDA', borderRadius: 12, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#EF9F27' }}>{data.bestCombo.avgYieldRatio.toFixed(1)}x</Text>
            <Text style={{ fontSize: 12, color: '#6b7280' }}>Best yield</Text>
          </View>
        )}
        {data.mostConsistent && (
          <View style={{ flex: 1, backgroundColor: '#E6F1FB', borderRadius: 12, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#185FA5' }}>{data.mostConsistent.avgYieldRatio.toFixed(1)}x</Text>
            <Text style={{ fontSize: 12, color: '#6b7280' }}>Most consistent</Text>
          </View>
        )}
      </View>

      {/* Best combo highlight */}
      {data.bestCombo && (
        <View style={{ backgroundColor: '#EAF3DE', borderWidth: 1, borderColor: '#97C459', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#27500A', marginBottom: 4 }}>{'\ud83c\udfc6'} Best Combo</Text>
          <Text style={{ color: '#3B6D11' }}>
            {data.bestCombo.beanEmoji} {data.bestCombo.beanName} in {data.bestCombo.containerName}
          </Text>
          <Text style={{ fontSize: 12, color: '#6b7280' }}>
            {data.bestCombo.avgYieldRatio.toFixed(1)}x yield {'\u00b7'} {data.bestCombo.avgFillPct.toFixed(0)}% fill {'\u00b7'} {data.bestCombo.avgRating.toFixed(1)} stars {'\u00b7'} {data.bestCombo.batchCount} batches
          </Text>
        </View>
      )}

      {/* Ask the Genie */}
      <TouchableOpacity
        activeOpacity={0.7}
        style={{ backgroundColor: '#E6F1FB', borderWidth: 1, borderColor: '#85B7EB', borderRadius: 12, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}
        onPress={onOpenGenie}
      >
        <Text style={{ fontSize: 20, marginRight: 12 }}>{'\ud83e\uddde'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#185FA5', fontWeight: '500' }}>Ask the Genie</Text>
          <Text style={{ fontSize: 12, color: '#6b7280' }}>Get AI-powered performance analysis</Text>
        </View>
        <Text style={{ color: '#85B7EB' }}>{'\u203a'}</Text>
      </TouchableOpacity>

      {/* Combo table */}
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#27500A', marginBottom: 12 }}>All Combos</Text>
      {data.combos.map((combo, i) => (
        <ComboRow key={`${combo.beanTypeId}-${combo.containerId}`} combo={combo} rank={i + 1} />
      ))}
    </ScrollView>
  )
}

function ComboRow({ combo, rank }: { combo: ComboStats; rank: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f9fafb' }}>
      <Text style={{ fontSize: 14, color: '#9ca3af', width: 24 }}>#{rank}</Text>
      <Text style={{ fontSize: 18, marginRight: 8 }}>{combo.beanEmoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '500', color: '#27500A' }}>{combo.beanName}</Text>
        <Text style={{ fontSize: 12, color: '#6b7280' }}>{combo.containerName}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#3B6D11' }}>{combo.avgYieldRatio.toFixed(1)}x</Text>
        <Text style={{ fontSize: 12, color: '#9ca3af' }}>
          {combo.avgRating.toFixed(1)}{'\u2605'} {'\u00b7'} {combo.batchCount} batches
        </Text>
      </View>
    </View>
  )
}
