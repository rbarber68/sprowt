/**
 * SproutPal — Photo Timeline Strip
 * 4 stage tabs: Day 0 (Soaking) / Day 2 (Sprouting) / Day 4 (Growing) / Harvest
 */

import { View, Text, Pressable, Image } from 'react-native'
import { useState } from 'react'

const STAGES = [
  { key: 'soaking', label: 'Day 0', emoji: '\ud83d\udca7', name: 'Soaking' },
  { key: 'sprouting', label: 'Day 2', emoji: '\ud83c\udf31', name: 'Sprouting' },
  { key: 'growing', label: 'Day 4', emoji: '\ud83c\udf3f', name: 'Growing' },
  { key: 'harvest', label: 'Harvest', emoji: '\ud83c\udf89', name: 'Harvest' },
] as const

interface PhotoTimelineProps {
  photos?: Record<string, string | null>
  stageNotes?: Record<string, string | null>
  onAddPhoto?: (stage: string) => void
}

export function PhotoTimeline({ photos = {}, stageNotes = {}, onAddPhoto }: PhotoTimelineProps) {
  const [activeStage, setActiveStage] = useState<typeof STAGES[number]['key']>(STAGES[0].key)

  const hasPhoto = !!photos[activeStage]
  const note = stageNotes[activeStage]

  return (
    <View>
      {/* Stage tabs */}
      <View className="flex-row mb-4">
        {STAGES.map((stage) => {
          const hasStagePhoto = !!photos[stage.key]
          return (
            <Pressable
              key={stage.key}
              className={`flex-1 items-center py-2 mx-1 rounded-chip ${
                activeStage === stage.key
                  ? 'bg-sprout-200'
                  : hasStagePhoto
                  ? 'bg-sprout-50'
                  : 'bg-gray-100'
              }`}
              onPress={() => setActiveStage(stage.key)}
            >
              {hasStagePhoto ? (
                <View className="w-6 h-6 rounded-full bg-sprout-400 items-center justify-center">
                  <Text className="text-white text-xs">\u2713</Text>
                </View>
              ) : (
                <Text className="text-lg">{stage.emoji}</Text>
              )}
              <Text className="text-xs text-gray-600">{stage.label}</Text>
            </Pressable>
          )
        })}
      </View>

      {/* Photo display area */}
      <View className="bg-gray-50 rounded-card items-center min-h-[160px] justify-center overflow-hidden">
        {hasPhoto ? (
          <View className="w-full">
            <Image
              source={{ uri: photos[activeStage]! }}
              className="w-full h-40"
              resizeMode="cover"
            />
            {note && (
              <View className="p-3">
                <Text className="text-sm text-gray-600">{note}</Text>
              </View>
            )}
            <Pressable
              className="absolute top-2 right-2 bg-white/80 px-2 py-1 rounded"
              onPress={() => onAddPhoto?.(activeStage)}
            >
              <Text className="text-xs text-gray-600">Retake</Text>
            </Pressable>
          </View>
        ) : (
          <View className="p-6 items-center">
            <Text className="text-5xl mb-2">
              {STAGES.find(s => s.key === activeStage)?.emoji}
            </Text>
            <Text className="text-gray-400 mb-2">No photo yet</Text>
            {onAddPhoto && (
              <Pressable
                className="bg-sprout-600 px-4 py-2 rounded-chip"
                onPress={() => onAddPhoto(activeStage)}
              >
                <Text className="text-white text-sm font-medium">Add photo</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  )
}
