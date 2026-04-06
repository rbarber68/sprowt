/**
 * SproutPal — Photo Timeline Strip
 * 4 stage tabs: Day 0 (Soaking) / Day 2 (Sprouting) / Day 4 (Growing) / Harvest
 */

import { View, Text, TouchableOpacity, Image } from 'react-native'
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
      <View style={{ flexDirection: 'row', marginBottom: 16 }}>
        {STAGES.map((stage) => {
          const hasStagePhoto = !!photos[stage.key]
          return (
            <TouchableOpacity
              key={stage.key}
              activeOpacity={0.7}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 8,
                marginHorizontal: 4,
                borderRadius: 20,
                backgroundColor:
                  activeStage === stage.key
                    ? '#97C459'
                    : hasStagePhoto
                    ? '#EAF3DE'
                    : '#f3f4f6',
              }}
              onPress={() => setActiveStage(stage.key)}
            >
              {hasStagePhoto ? (
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#639922', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#ffffff', fontSize: 12 }}>✓</Text>
                </View>
              ) : (
                <Text style={{ fontSize: 18 }}>{stage.emoji}</Text>
              )}
              <Text style={{ fontSize: 12, color: '#4b5563' }}>{stage.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Photo display area */}
      <View style={{ backgroundColor: '#f9fafb', borderRadius: 12, alignItems: 'center', minHeight: 160, justifyContent: 'center', overflow: 'hidden' }}>
        {hasPhoto ? (
          <View style={{ width: '100%' }}>
            <Image
              source={{ uri: photos[activeStage]! }}
              style={{ width: '100%', height: 160 }}
              resizeMode="cover"
            />
            {note && (
              <View style={{ padding: 12 }}>
                <Text style={{ fontSize: 14, color: '#4b5563' }}>{note}</Text>
              </View>
            )}
            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: 'rgba(255,255,255,0.8)',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
              }}
              onPress={() => onAddPhoto?.(activeStage)}
            >
              <Text style={{ fontSize: 12, color: '#4b5563' }}>Retake</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 48, marginBottom: 8 }}>
              {STAGES.find(s => s.key === activeStage)?.emoji}
            </Text>
            <Text style={{ color: '#9ca3af', marginBottom: 8 }}>No photo yet</Text>
            {onAddPhoto && (
              <TouchableOpacity
                activeOpacity={0.7}
                style={{ backgroundColor: '#3B6D11', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
                onPress={() => onAddPhoto(activeStage)}
              >
                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>Add photo</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  )
}
