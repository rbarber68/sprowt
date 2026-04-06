/**
 * SproutPal — Fun Mode Batch Card
 * Shows character avatar, name, stage, progress bar, status badge
 */

import { View, Text, TouchableOpacity } from 'react-native'
import { CharacterAvatar } from './CharacterAvatar'

interface BatchCardFunProps {
  batch: {
    id: string
    jarLabel: string
    status: string
    beanName: string
    beanEmoji: string
    characterName: string
    characterEmoji: string
    faceColor: string
    eyeColor: string
    eyeShape: string
    mouth: string
    accessoryEmoji: string
    dayNumber: number
    totalDays: number
    isOverdue?: boolean
  }
  onPress: () => void
  onRinseLog: () => void
}

export function BatchCardFun({ batch, onPress, onRinseLog }: BatchCardFunProps) {
  const progress = Math.min(batch.dayNumber / batch.totalDays, 1)
  const isOverdue = batch.isOverdue ?? false

  const cardStyle = isOverdue
    ? { borderColor: '#993C1D', backgroundColor: '#FAECE7' }
    : batch.status === 'ready'
    ? { borderColor: '#97C459', backgroundColor: '#EAF3DE' }
    : batch.status === 'soaking'
    ? { borderColor: '#EF9F27', backgroundColor: '#FAEEDA' }
    : { borderColor: '#e5e7eb', backgroundColor: '#ffffff' }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={{
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        ...cardStyle,
      }}
      onPress={onPress}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <CharacterAvatar
          faceColor={batch.faceColor}
          eyeColor={batch.eyeColor}
          eyeShape={batch.eyeShape}
          mouth={batch.mouth}
          accessoryEmoji={batch.accessoryEmoji}
          size={48}
          animation={isOverdue ? 'distress' : 'idle'}
          distressMouth="o"
        />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={{ fontWeight: 'bold', color: '#27500A' }}>{batch.characterName}</Text>
          <Text style={{ fontSize: 14, color: '#6b7280' }}>
            {batch.beanEmoji} {batch.beanName} · {batch.jarLabel}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={{ height: 8, backgroundColor: '#e5e7eb', borderRadius: 9999, marginBottom: 8 }}>
        <View
          style={{ height: 8, backgroundColor: '#639922', borderRadius: 9999, width: `${progress * 100}%` }}
        />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: '#6b7280' }}>
          Day {batch.dayNumber} of {batch.totalDays}
        </Text>
        <StatusBadge status={batch.status} isOverdue={isOverdue} />
      </View>

      {batch.status === 'growing' && (
        <TouchableOpacity
          activeOpacity={0.7}
          style={{
            marginTop: 8,
            backgroundColor: '#E6F1FB',
            borderWidth: 1,
            borderColor: '#85B7EB',
            borderRadius: 20,
            paddingVertical: 4,
            paddingHorizontal: 12,
            alignSelf: 'flex-start',
          }}
          onPress={onRinseLog}
        >
          <Text style={{ color: '#185FA5', fontSize: 12, fontWeight: '500' }}>Log rinse</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  )
}

function StatusBadge({ status, isOverdue }: { status: string; isOverdue: boolean }) {
  if (isOverdue) {
    return (
      <View style={{ backgroundColor: '#F0997B', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 }}>
        <Text style={{ color: '#712B13', fontSize: 12, fontWeight: 'bold' }}>Rinse me!</Text>
      </View>
    )
  }

  const config: Record<string, { bg: string; text: string; label: string }> = {
    soaking:   { bg: '#FAC775', text: '#633806',  label: 'Soaking' },
    growing:   { bg: '#C0DD97', text: '#27500A',  label: 'Growing' },
    ready:     { bg: '#97C459', text: '#ffffff',  label: 'HARVEST NOW' },
    harvested: { bg: '#e5e7eb', text: '#4b5563',  label: 'Harvested' },
  }

  const c = config[status] ?? config.growing

  return (
    <View style={{ backgroundColor: c.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 }}>
      <Text style={{ color: c.text, fontSize: 12, fontWeight: 'bold' }}>{c.label}</Text>
    </View>
  )
}
