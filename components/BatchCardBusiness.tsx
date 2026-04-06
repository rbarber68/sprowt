/**
 * SproutPal — Business Mode Batch Card
 * Compact row: emoji | name + jar | temp range | rinse freq | day X of Y | status
 */

import { View, Text, Pressable } from 'react-native'

interface BatchCardBusinessProps {
  batch: {
    id: string
    jarLabel: string
    status: string
    beanName: string
    beanEmoji: string
    minTempF: number
    maxTempF: number
    rinsesPerDay: number
    dayNumber: number
    totalDays: number
  }
  onPress: () => void
}

export function BatchCardBusiness({ batch, onPress }: BatchCardBusinessProps) {
  return (
    <Pressable
      className="flex-row items-center px-4 py-3 border-b border-gray-100"
      onPress={onPress}
    >
      <Text className="text-2xl mr-3">{batch.beanEmoji}</Text>
      <View className="flex-1">
        <Text className="font-medium text-sprout-800">
          {batch.beanName} · {batch.jarLabel}
        </Text>
        <Text className="text-xs text-gray-500">
          {batch.minTempF}–{batch.maxTempF}°F · {batch.rinsesPerDay}x/day
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-sm font-medium text-sprout-600">
          Day {batch.dayNumber}/{batch.totalDays}
        </Text>
        <Text className="text-xs text-gray-400 capitalize">{batch.status}</Text>
      </View>
    </Pressable>
  )
}
