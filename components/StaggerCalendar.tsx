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
      <View style={{ padding: 16, alignItems: 'center' }}>
        <Text style={{ color: '#9ca3af' }}>No stagger plan generated yet</Text>
      </View>
    )
  }

  return (
    <ScrollView style={{ maxHeight: 320 }}>
      {plan.map((batch, index) => (
        <View
          key={index}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}
        >
          <Text style={{ fontSize: 24, marginRight: 12 }}>{batch.beanType.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '500', color: '#27500A' }}>{batch.beanType.name}</Text>
            <Text style={{ fontSize: 12, color: '#6b7280' }}>
              Soak: {formatDate(batch.soakStartDate)} → Harvest: {formatDate(batch.harvestDate)}
            </Text>
          </View>
          <View style={{ backgroundColor: '#C0DD97', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 }}>
            <Text style={{ color: '#27500A', fontSize: 12, fontWeight: '500' }}>Day +{batch.dayOffset}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  )
}
