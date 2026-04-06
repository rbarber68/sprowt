/**
 * SproutPal — Stagger Calendar Component
 * Displays rolling batch schedule for stagger optimizer
 */

import { View, Text, ScrollView } from 'react-native'
import type { StaggerBatch } from '@/lib/stagger'

interface StaggerCalendarProps {
  plan: StaggerBatch[]
}

export function StaggerCalendar({ plan }: StaggerCalendarProps) {
  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  if (plan.length === 0) {
    return (
      <View className="p-4 items-center">
        <Text className="text-gray-400">No stagger plan generated yet</Text>
      </View>
    )
  }

  return (
    <ScrollView className="max-h-80">
      {plan.map((batch, index) => (
        <View
          key={index}
          className="flex-row items-center px-4 py-3 border-b border-gray-100"
        >
          <Text className="text-2xl mr-3">{batch.beanType.emoji}</Text>
          <View className="flex-1">
            <Text className="font-medium text-sprout-800">{batch.beanType.name}</Text>
            <Text className="text-xs text-gray-500">
              Soak: {formatDate(batch.soakStartDate)} → Harvest: {formatDate(batch.harvestDate)}
            </Text>
          </View>
          <View className="bg-sprout-100 px-2 py-0.5 rounded-chip">
            <Text className="text-sprout-800 text-xs font-medium">Day +{batch.dayOffset}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  )
}
