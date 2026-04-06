/**
 * SproutPal — Business Mode Batch Card
 * Compact row: emoji | name + jar | temp range | rinse freq | day X of Y | status
 */

import { View, Text, TouchableOpacity } from 'react-native'

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
    <TouchableOpacity
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
      }}
      onPress={onPress}
    >
      <Text style={{ fontSize: 24, marginRight: 12 }}>{batch.beanEmoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '500', color: '#27500A' }}>
          {batch.beanName} · {batch.jarLabel}
        </Text>
        <Text style={{ fontSize: 12, color: '#6b7280' }}>
          {batch.minTempF}–{batch.maxTempF}°F · {batch.rinsesPerDay}x/day
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 14, fontWeight: '500', color: '#3B6D11' }}>
          Day {batch.dayNumber}/{batch.totalDays}
        </Text>
        <Text style={{ fontSize: 12, color: '#9ca3af', textTransform: 'capitalize' }}>{batch.status}</Text>
      </View>
    </TouchableOpacity>
  )
}
