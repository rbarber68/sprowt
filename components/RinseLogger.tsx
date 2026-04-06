/**
 * SproutPal — Rinse Logger Bottom Sheet
 * Quick-tap temp buttons + rinse water temp + observation chips
 */

import { View, Text, TouchableOpacity } from 'react-native'
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
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#27500A', marginBottom: 16 }}>Log Rinse</Text>

      {/* Room temperature */}
      <Text style={{ fontSize: 14, fontWeight: '500', color: '#4b5563', marginBottom: 8 }}>Room temp (optional)</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {ROOM_TEMPS.map(temp => (
          <TouchableOpacity
            key={temp}
            activeOpacity={0.7}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 9999,
              borderWidth: 1,
              backgroundColor: roomTemp === temp ? '#97C459' : '#ffffff',
              borderColor: roomTemp === temp ? '#639922' : '#e5e7eb',
            }}
            onPress={() => setRoomTemp(roomTemp === temp ? undefined : temp)}
          >
            <Text style={{ color: roomTemp === temp ? '#27500A' : '#4b5563', fontWeight: roomTemp === temp ? '500' : '400' }}>
              {temp}°F
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Rinse water temp */}
      <Text style={{ fontSize: 14, fontWeight: '500', color: '#4b5563', marginBottom: 8 }}>Rinse water (optional)</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {WATER_TEMPS.map(temp => (
          <TouchableOpacity
            key={temp}
            activeOpacity={0.7}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 9999,
              borderWidth: 1,
              backgroundColor: waterTemp === temp ? '#FAC775' : '#ffffff',
              borderColor: waterTemp === temp ? '#BA7517' : '#e5e7eb',
            }}
            onPress={() => setWaterTemp(waterTemp === temp ? undefined : temp)}
          >
            <Text style={{ color: waterTemp === temp ? '#4b5563' : '#4b5563', fontWeight: waterTemp === temp ? '500' : '400' }}>
              {temp}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Observations */}
      <Text style={{ fontSize: 14, fontWeight: '500', color: '#4b5563', marginBottom: 8 }}>Observations (optional)</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {OBSERVATIONS.map(obs => (
          <TouchableOpacity
            key={obs}
            activeOpacity={0.7}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 9999,
              borderWidth: 1,
              backgroundColor: observations.includes(obs) ? '#FAC775' : '#ffffff',
              borderColor: observations.includes(obs) ? '#BA7517' : '#e5e7eb',
            }}
            onPress={() => toggleObservation(obs)}
          >
            <Text style={{ color: observations.includes(obs) ? '#4b5563' : '#4b5563', fontSize: 14 }}>
              {obs}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Submit */}
      <TouchableOpacity
        activeOpacity={0.7}
        style={{ backgroundColor: '#3B6D11', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
        onPress={() => onSubmit({ roomTempF: roomTemp, rinseWaterTemp: waterTemp, observations })}
      >
        <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16 }}>Log Rinse</Text>
      </TouchableOpacity>
    </View>
  )
}
