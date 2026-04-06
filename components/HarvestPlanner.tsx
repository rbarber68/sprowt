/**
 * SproutPal — Harvest Planner Component
 * Timeline display: soak dot -> jar dot -> harvest dot with dates
 */

import { View, Text } from 'react-native'

interface HarvestPlannerProps {
  beanName: string
  beanEmoji: string
  soakDate: Date
  jarDate: Date
  harvestDate: Date
}

export function HarvestPlanner({
  beanName,
  beanEmoji,
  soakDate,
  jarDate,
  harvestDate,
}: HarvestPlannerProps) {
  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <View className="bg-white rounded-card p-4 border border-gray-200">
      <Text className="text-lg font-bold text-sprout-800 mb-4">
        {beanEmoji} {beanName} Timeline
      </Text>

      <View className="flex-row items-center justify-between">
        {/* Soak */}
        <View className="items-center flex-1">
          <View className="w-8 h-8 rounded-full bg-soak-200 items-center justify-center">
            <Text>💧</Text>
          </View>
          <Text className="text-xs text-gray-600 mt-1">Soak</Text>
          <Text className="text-xs font-medium text-soak-600">{formatDate(soakDate)}</Text>
        </View>

        {/* Line */}
        <View className="h-0.5 flex-1 bg-gray-300 -mt-4" />

        {/* Jar */}
        <View className="items-center flex-1">
          <View className="w-8 h-8 rounded-full bg-sprout-200 items-center justify-center">
            <Text>🫙</Text>
          </View>
          <Text className="text-xs text-gray-600 mt-1">Jar</Text>
          <Text className="text-xs font-medium text-sprout-600">{formatDate(jarDate)}</Text>
        </View>

        {/* Line */}
        <View className="h-0.5 flex-1 bg-gray-300 -mt-4" />

        {/* Harvest */}
        <View className="items-center flex-1">
          <View className="w-8 h-8 rounded-full bg-harvest-200 items-center justify-center">
            <Text>🎉</Text>
          </View>
          <Text className="text-xs text-gray-600 mt-1">Harvest</Text>
          <Text className="text-xs font-medium text-harvest-600">{formatDate(harvestDate)}</Text>
        </View>
      </View>
    </View>
  )
}
