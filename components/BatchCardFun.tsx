/**
 * SproutPal — Fun Mode Batch Card
 * Full-width card with character avatar, circular progress, stage info
 */

import { View, Text, TouchableOpacity } from 'react-native'
import { CharacterAvatar } from './CharacterAvatar'
import Svg, { Circle } from 'react-native-svg'

interface BatchCardFunProps {
  batch: {
    id: string
    characterId?: string
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
  onCharacterPress?: () => void
}

function CircularProgress({ progress, size, color }: { progress: number; size: number; color: string }) {
  const strokeWidth = 4
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - Math.min(progress, 1))

  return (
    <Svg width={size} height={size} style={{ position: 'absolute' }}>
      <Circle
        cx={size / 2} cy={size / 2} r={radius}
        stroke="#e5e7eb" strokeWidth={strokeWidth} fill="none"
      />
      <Circle
        cx={size / 2} cy={size / 2} r={radius}
        stroke={color} strokeWidth={strokeWidth} fill="none"
        strokeDasharray={`${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        rotation="-90" origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  )
}

export function BatchCardFun({ batch, onPress, onRinseLog, onCharacterPress }: BatchCardFunProps) {
  const progress = Math.min(batch.dayNumber / batch.totalDays, 1)
  const isOverdue = batch.isOverdue ?? false
  const daysLeft = Math.max(0, batch.totalDays - batch.dayNumber)

  const statusConfig: Record<string, { bg: string; border: string; accent: string; label: string; labelBg: string; labelText: string }> = {
    soaking:   { bg: '#FAEEDA', border: '#EF9F27', accent: '#EF9F27', label: 'Soaking',      labelBg: '#FAC775', labelText: '#633806' },
    growing:   { bg: '#ffffff', border: '#e5e7eb', accent: '#639922', label: 'Growing',       labelBg: '#C0DD97', labelText: '#27500A' },
    ready:     { bg: '#EAF3DE', border: '#97C459', accent: '#3B6D11', label: 'HARVEST NOW',   labelBg: '#3B6D11', labelText: '#ffffff' },
    harvested: { bg: '#f9fafb', border: '#e5e7eb', accent: '#9ca3af', label: 'Harvested',     labelBg: '#e5e7eb', labelText: '#4b5563' },
  }

  const overdueCfg = { bg: '#FAECE7', border: '#F0997B', accent: '#D85A30', label: 'Needs rinse!', labelBg: '#D85A30', labelText: '#ffffff' }
  const cfg = isOverdue ? overdueCfg : (statusConfig[batch.status] ?? statusConfig.growing)

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        backgroundColor: cfg.bg,
        borderWidth: 1.5,
        borderColor: cfg.border,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Character avatar with circular progress ring — tap to open profile */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={(e) => { e.stopPropagation(); onCharacterPress?.() }}
          disabled={!onCharacterPress}
          style={{ width: 72, height: 72, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}
        >
          <CircularProgress progress={progress} size={72} color={cfg.accent} />
          <CharacterAvatar
            faceColor={batch.faceColor}
            eyeColor={batch.eyeColor}
            eyeShape={batch.eyeShape}
            mouth={batch.mouth}
            accessoryEmoji={batch.accessoryEmoji}
            size={52}
            animation={isOverdue ? 'distress' : batch.status === 'ready' ? 'celebrate' : 'idle'}
            distressMouth="o"
          />
        </TouchableOpacity>

        {/* Info section */}
        <View style={{ flex: 1 }}>
          {/* Name + status badge row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontWeight: 'bold', color: '#27500A', fontSize: 15, flex: 1 }} numberOfLines={2}>
              {batch.characterName}
            </Text>
            <View style={{ backgroundColor: cfg.labelBg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 }}>
              <Text style={{ color: cfg.labelText, fontSize: 11, fontWeight: 'bold' }}>{cfg.label}</Text>
            </View>
          </View>

          {/* Sprout type + jar */}
          <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>
            {batch.beanEmoji} {batch.beanName} {'\u00b7'} {batch.jarLabel}
          </Text>

          {/* Progress bar + days */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 1, height: 6, backgroundColor: '#e5e7eb', borderRadius: 3 }}>
              <View style={{ height: 6, backgroundColor: cfg.accent, borderRadius: 3, width: `${progress * 100}%` }} />
            </View>
            <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '500', minWidth: 50, textAlign: 'right' }}>
              {batch.status === 'ready' ? 'Ready!' : batch.status === 'soaking' ? 'Soaking' : `${daysLeft}d left`}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick action button */}
      {batch.status === 'growing' && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onRinseLog}
          style={{
            marginTop: 10,
            backgroundColor: '#E6F1FB',
            borderWidth: 1,
            borderColor: '#85B7EB',
            borderRadius: 10,
            paddingVertical: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#185FA5', fontSize: 13, fontWeight: '600' }}>{'\ud83d\udca7'} Log Rinse</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  )
}
