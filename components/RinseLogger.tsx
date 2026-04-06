/**
 * SproutPal — Rinse Logger Bottom Sheet
 * Quick-tap temp buttons + rinse water temp + observation chips
 */

import { View, Text, Pressable } from 'react-native'
import { useState } from 'react'

const ROOM_TEMPS = [62, 68, 72, 78]
const WATER_TEMPS = ['Cold', 'Cool', 'Warm'] as const
const OBSERVATIONS = ['Looking good', 'Fuzzy roots', 'Growing fast', 'Smells off', 'Slow start']

interface RinseLoggerProps {
  onSubmit: (data: {
    roomTempF?: number
    rinseWaterTemp?: string
    observations: string[]
  }) => void
}

export function RinseLogger({ onSubmit }: RinseLoggerProps) {
  const [roomTemp, setRoomTemp] = useState<number | undefined>()
  const [waterTemp, setWaterTemp] = useState<string | undefined>()
  const [observations, setObservations] = useState<string[]>([])

  const toggleObservation = (obs: string) => {
    setObservations(prev =>
      prev.includes(obs) ? prev.filter(o => o !== obs) : [...prev, obs]
    )
  }

  return (
    <View className="p-4">
      <Text className="text-lg font-bold text-sprout-800 mb-4">Log Rinse</Text>

      {/* Room temperature */}
      <Text className="text-sm font-medium text-gray-600 mb-2">Room temp (optional)</Text>
      <View className="flex-row gap-2 mb-4">
        {ROOM_TEMPS.map(temp => (
          <Pressable
            key={temp}
            className={`px-4 py-2 rounded-chip border ${
              roomTemp === temp ? 'bg-sprout-200 border-sprout-400' : 'bg-white border-gray-200'
            }`}
            onPress={() => setRoomTemp(roomTemp === temp ? undefined : temp)}
          >
            <Text className={roomTemp === temp ? 'text-sprout-800 font-medium' : 'text-gray-600'}>
              {temp}°F
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Rinse water temp */}
      <Text className="text-sm font-medium text-gray-600 mb-2">Rinse water (optional)</Text>
      <View className="flex-row gap-2 mb-4">
        {WATER_TEMPS.map(temp => (
          <Pressable
            key={temp}
            className={`px-4 py-2 rounded-chip border ${
              waterTemp === temp ? 'bg-info-100 border-info-400' : 'bg-white border-gray-200'
            }`}
            onPress={() => setWaterTemp(waterTemp === temp ? undefined : temp)}
          >
            <Text className={waterTemp === temp ? 'text-info-800 font-medium' : 'text-gray-600'}>
              {temp}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Observations */}
      <Text className="text-sm font-medium text-gray-600 mb-2">Observations (optional)</Text>
      <View className="flex-row flex-wrap gap-2 mb-6">
        {OBSERVATIONS.map(obs => (
          <Pressable
            key={obs}
            className={`px-3 py-1.5 rounded-chip border ${
              observations.includes(obs) ? 'bg-soak-100 border-soak-400' : 'bg-white border-gray-200'
            }`}
            onPress={() => toggleObservation(obs)}
          >
            <Text className={observations.includes(obs) ? 'text-soak-800 text-sm' : 'text-gray-600 text-sm'}>
              {obs}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Submit */}
      <Pressable
        className="bg-sprout-600 py-3 rounded-card items-center"
        onPress={() => onSubmit({ roomTempF: roomTemp, rinseWaterTemp: waterTemp, observations })}
      >
        <Text className="text-white font-bold text-base">Log Rinse</Text>
      </Pressable>
    </View>
  )
}
