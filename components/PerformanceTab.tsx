/**
 * SproutPal — Performance Analytics Tab
 * Stats cards, combo table, Genie analysis button
 */

import { View, Text, Pressable, ScrollView } from 'react-native'
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
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-5xl mb-4">{'\ud83d\udcca'}</Text>
        <Text className="text-xl font-bold text-sprout-800 mb-2">No yield data yet</Text>
        <Text className="text-gray-500 text-center">
          Complete a batch with yield tracking to see performance analytics.
        </Text>
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 p-4">
      {/* Stats cards */}
      <View className="flex-row gap-3 mb-4">
        <View className="flex-1 bg-sprout-50 rounded-card p-3 items-center">
          <Text className="text-2xl font-bold text-sprout-600">{data.totalTrackedBatches}</Text>
          <Text className="text-xs text-gray-500">Tracked</Text>
        </View>
        {data.bestCombo && (
          <View className="flex-1 bg-soak-50 rounded-card p-3 items-center">
            <Text className="text-2xl font-bold text-soak-600">{data.bestCombo.avgYieldRatio.toFixed(1)}x</Text>
            <Text className="text-xs text-gray-500">Best yield</Text>
          </View>
        )}
        {data.mostConsistent && (
          <View className="flex-1 bg-info-50 rounded-card p-3 items-center">
            <Text className="text-2xl font-bold text-info-600">{data.mostConsistent.avgYieldRatio.toFixed(1)}x</Text>
            <Text className="text-xs text-gray-500">Most consistent</Text>
          </View>
        )}
      </View>

      {/* Best combo highlight */}
      {data.bestCombo && (
        <View className="bg-sprout-50 border border-sprout-200 rounded-card p-4 mb-4">
          <Text className="text-sm font-medium text-sprout-800 mb-1">{'\ud83c\udfc6'} Best Combo</Text>
          <Text className="text-sprout-600">
            {data.bestCombo.beanEmoji} {data.bestCombo.beanName} in {data.bestCombo.containerName}
          </Text>
          <Text className="text-xs text-gray-500">
            {data.bestCombo.avgYieldRatio.toFixed(1)}x yield {'\u00b7'} {data.bestCombo.avgFillPct.toFixed(0)}% fill {'\u00b7'} {data.bestCombo.avgRating.toFixed(1)} stars {'\u00b7'} {data.bestCombo.batchCount} batches
          </Text>
        </View>
      )}

      {/* Ask the Genie */}
      <Pressable
        className="bg-info-50 border border-info-200 rounded-card p-4 mb-4 flex-row items-center"
        onPress={onOpenGenie}
      >
        <Text className="text-xl mr-3">{'\ud83e\uddde'}</Text>
        <View className="flex-1">
          <Text className="text-info-600 font-medium">Ask the Genie</Text>
          <Text className="text-xs text-gray-500">Get AI-powered performance analysis</Text>
        </View>
        <Text className="text-info-400">{'\u203a'}</Text>
      </Pressable>

      {/* Combo table */}
      <Text className="text-lg font-bold text-sprout-800 mb-3">All Combos</Text>
      {data.combos.map((combo, i) => (
        <ComboRow key={`${combo.beanTypeId}-${combo.containerId}`} combo={combo} rank={i + 1} />
      ))}
    </ScrollView>
  )
}

function ComboRow({ combo, rank }: { combo: ComboStats; rank: number }) {
  return (
    <View className="flex-row items-center py-3 border-b border-gray-50">
      <Text className="text-sm text-gray-400 w-6">#{rank}</Text>
      <Text className="text-lg mr-2">{combo.beanEmoji}</Text>
      <View className="flex-1">
        <Text className="text-sm font-medium text-sprout-800">{combo.beanName}</Text>
        <Text className="text-xs text-gray-500">{combo.containerName}</Text>
      </View>
      <View className="items-end">
        <Text className="text-sm font-bold text-sprout-600">{combo.avgYieldRatio.toFixed(1)}x</Text>
        <Text className="text-xs text-gray-400">
          {combo.avgRating.toFixed(1)}{'\u2605'} {'\u00b7'} {combo.batchCount} batches
        </Text>
      </View>
    </View>
  )
}
