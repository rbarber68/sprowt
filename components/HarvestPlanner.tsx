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
    <View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#27500A', marginBottom: 16 }}>
        {beanEmoji} {beanName} Timeline
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Soak */}
        <View style={{ alignItems: 'center', flex: 1 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#EF9F27', alignItems: 'center', justifyContent: 'center' }}>
            <Text>💧</Text>
          </View>
          <Text style={{ fontSize: 12, color: '#4b5563', marginTop: 4 }}>Soak</Text>
          <Text style={{ fontSize: 12, fontWeight: '500', color: '#EF9F27' }}>{formatDate(soakDate)}</Text>
        </View>

        {/* Line */}
        <View style={{ height: 2, flex: 1, backgroundColor: '#d1d5db', marginTop: -16 }} />

        {/* Jar */}
        <View style={{ alignItems: 'center', flex: 1 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#97C459', alignItems: 'center', justifyContent: 'center' }}>
            <Text>🫙</Text>
          </View>
          <Text style={{ fontSize: 12, color: '#4b5563', marginTop: 4 }}>Jar</Text>
          <Text style={{ fontSize: 12, fontWeight: '500', color: '#3B6D11' }}>{formatDate(jarDate)}</Text>
        </View>

        {/* Line */}
        <View style={{ height: 2, flex: 1, backgroundColor: '#d1d5db', marginTop: -16 }} />

        {/* Harvest */}
        <View style={{ alignItems: 'center', flex: 1 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#97C459', alignItems: 'center', justifyContent: 'center' }}>
            <Text>🎉</Text>
          </View>
          <Text style={{ fontSize: 12, color: '#4b5563', marginTop: 4 }}>Harvest</Text>
          <Text style={{ fontSize: 12, fontWeight: '500', color: '#3B6D11' }}>{formatDate(harvestDate)}</Text>
        </View>
      </View>
    </View>
  )
}
