/**
 * SproutPal — Speak Button
 * Small speaker icon that reads text aloud in character voice
 */

import { TouchableOpacity, Text } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { useState, useEffect } from 'react'
import { speak, stopSpeaking } from '@/lib/speech'
import type { PersonalityKey } from '@/data/characters'

interface SpeakButtonProps {
  text: string
  personality: PersonalityKey
  voiceStyle?: string
  size?: 'sm' | 'md'
}

export function SpeakButton({ text, personality, voiceStyle, size = 'sm' }: SpeakButtonProps) {
  const [speaking, setSpeaking] = useState(false)
  const pulse = useSharedValue(1)

  useEffect(() => {
    if (speaking) {
      pulse.value = withRepeat(
        withTiming(1.2, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      )
    } else {
      pulse.value = withTiming(1, { duration: 200 })
    }
  }, [speaking])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }))

  const handlePress = async () => {
    if (speaking) {
      await stopSpeaking()
      setSpeaking(false)
    } else {
      setSpeaking(true)
      await speak(text, personality, voiceStyle, () => setSpeaking(false))
    }
  }

  const dimension = size === 'md' ? 40 : 28

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        activeOpacity={0.7}
        style={{
          width: dimension,
          height: dimension,
          borderRadius: 9999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: speaking ? '#97C459' : '#f3f4f6',
        }}
        onPress={handlePress}
      >
        <Text style={{ fontSize: size === 'md' ? 18 : 13 }}>
          {speaking ? '\ud83d\udd0a' : '\ud83d\udd08'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  )
}
