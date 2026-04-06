/**
 * SproutPal — Fun Mode Batch Card
 * Shows character avatar, name, stage, progress bar, status badge
 */

import { View, Text, Pressable } from 'react-native'
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

  const borderClass = isOverdue
    ? 'border-alert-600 bg-alert-50'
    : batch.status === 'ready'
    ? 'border-sprout-200 bg-sprout-50'
    : batch.status === 'soaking'
    ? 'border-soak-200 bg-soak-50'
    : 'border-gray-200 bg-white'

  return (
    <Pressable
      className={`border rounded-card p-3 mb-3 ${borderClass}`}
      onPress={onPress}
    >
      <View className="flex-row items-center mb-2">
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
        <View className="ml-3 flex-1">
          <Text className="font-bold text-sprout-800">{batch.characterName}</Text>
          <Text className="text-sm text-gray-500">
            {batch.beanEmoji} {batch.beanName} · {batch.jarLabel}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View className="h-2 bg-gray-200 rounded-full mb-2">
        <View
          className="h-2 bg-sprout-400 rounded-full"
          style={{ width: `${progress * 100}%` }}
        />
      </View>

      <View className="flex-row justify-between items-center">
        <Text className="text-xs text-gray-500">
          Day {batch.dayNumber} of {batch.totalDays}
        </Text>
        <StatusBadge status={batch.status} isOverdue={isOverdue} />
      </View>

      {batch.status === 'growing' && (
        <Pressable
          className="mt-2 bg-info-50 border border-info-200 rounded-chip py-1 px-3 self-start"
          onPress={onRinseLog}
        >
          <Text className="text-info-600 text-xs font-medium">Log rinse</Text>
        </Pressable>
      )}
    </Pressable>
  )
}

function StatusBadge({ status, isOverdue }: { status: string; isOverdue: boolean }) {
  if (isOverdue) {
    return (
      <View className="bg-alert-200 px-2 py-0.5 rounded-chip">
        <Text className="text-alert-800 text-xs font-bold">Rinse me!</Text>
      </View>
    )
  }

  const config: Record<string, { bg: string; text: string; label: string }> = {
    soaking:   { bg: 'bg-soak-100',   text: 'text-soak-800',   label: 'Soaking' },
    growing:   { bg: 'bg-sprout-100', text: 'text-sprout-800', label: 'Growing' },
    ready:     { bg: 'bg-sprout-200', text: 'text-white',      label: 'HARVEST NOW' },
    harvested: { bg: 'bg-gray-200',   text: 'text-gray-600',   label: 'Harvested' },
  }

  const c = config[status] ?? config.growing

  return (
    <View className={`${c.bg} px-2 py-0.5 rounded-chip`}>
      <Text className={`${c.text} text-xs font-bold`}>{c.label}</Text>
    </View>
  )
}
