/**
 * SproutPal — Animated Character Avatar
 * CSS-drawn face with reanimated animations:
 * idle (gentle bounce), distress (wobble), celebrate (spin+scale), reveal (dice roll), blink
 */

import { View, Text } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated'
import { useEffect, useState } from 'react'

type AnimationState = 'idle' | 'distress' | 'celebrate' | 'reveal' | 'none'

interface CharacterAvatarProps {
  faceColor: string
  eyeColor: string
  eyeShape: 'round' | 'square' | 'sleepy' | 'arch' | string
  mouth: string
  accessoryEmoji: string
  size?: number
  animation?: AnimationState
  distressMouth?: string
}

export function CharacterAvatar({
  faceColor,
  eyeColor,
  eyeShape,
  mouth,
  accessoryEmoji,
  size = 64,
  animation = 'idle',
  distressMouth,
}: CharacterAvatarProps) {
  const eyeSize = size * 0.15
  const eyeRadius = eyeShape === 'round' ? eyeSize / 2
    : eyeShape === 'sleepy' ? eyeSize / 4
    : eyeShape === 'arch' ? eyeSize / 3
    : 2

  // Animation values
  const translateY = useSharedValue(0)
  const rotate = useSharedValue(0)
  const scale = useSharedValue(1)
  const accessoryRotate = useSharedValue(0)
  const eyeScaleY = useSharedValue(1)
  const [isBlinking, setIsBlinking] = useState(false)

  // Blink timer
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true)
      setTimeout(() => setIsBlinking(false), 150)
    }
    const interval = setInterval(blink, 3000 + Math.random() * 2000)
    return () => clearInterval(interval)
  }, [])

  // Animation controller
  useEffect(() => {
    // Reset all
    translateY.value = 0
    rotate.value = 0
    scale.value = 1
    accessoryRotate.value = 0

    switch (animation) {
      case 'idle':
        // Gentle floating bounce
        translateY.value = withRepeat(
          withSequence(
            withTiming(-size * 0.04, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
            withTiming(size * 0.02, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          ),
          -1, // infinite
          true,
        )
        // Accessory gentle sway
        accessoryRotate.value = withRepeat(
          withSequence(
            withTiming(-5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            withTiming(5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          true,
        )
        break

      case 'distress':
        // Frantic wobble
        rotate.value = withRepeat(
          withSequence(
            withTiming(-8, { duration: 80 }),
            withTiming(8, { duration: 80 }),
            withTiming(-6, { duration: 80 }),
            withTiming(6, { duration: 80 }),
            withTiming(0, { duration: 80 }),
          ),
          -1,
        )
        // Shiver/shake
        translateY.value = withRepeat(
          withSequence(
            withTiming(-2, { duration: 60 }),
            withTiming(2, { duration: 60 }),
          ),
          -1,
          true,
        )
        // Accessory flies off slightly
        accessoryRotate.value = withRepeat(
          withSequence(
            withTiming(-15, { duration: 100 }),
            withTiming(15, { duration: 100 }),
          ),
          -1,
          true,
        )
        break

      case 'celebrate':
        // Spin + scale up + bounce
        rotate.value = withSequence(
          withTiming(360, { duration: 600, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 0 }),
        )
        scale.value = withSequence(
          withSpring(1.3, { damping: 4, stiffness: 200 }),
          withDelay(300, withSpring(1, { damping: 8 })),
        )
        // Then settle into happy bounce
        translateY.value = withDelay(
          800,
          withRepeat(
            withSequence(
              withSpring(-size * 0.08, { damping: 3, stiffness: 300 }),
              withSpring(0, { damping: 6 }),
            ),
            3,
          ),
        )
        // Accessory goes crazy
        accessoryRotate.value = withSequence(
          withTiming(720, { duration: 600 }),
          withTiming(0, { duration: 300 }),
        )
        break

      case 'reveal':
        // Dice roll reveal: scale from 0, spin in, bounce land
        scale.value = 0
        rotate.value = -720
        scale.value = withDelay(
          200,
          withSpring(1, { damping: 6, stiffness: 150 }),
        )
        rotate.value = withDelay(
          200,
          withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) }),
        )
        // Bounce on land
        translateY.value = withDelay(
          900,
          withSequence(
            withSpring(-size * 0.1, { damping: 3, stiffness: 400 }),
            withSpring(0, { damping: 8 }),
          ),
        )
        break

      case 'none':
        break
    }
  }, [animation, size])

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
  }))

  const accessoryStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${accessoryRotate.value}deg` },
    ],
  }))

  const currentMouth = animation === 'distress' && distressMouth ? distressMouth : mouth
  const currentEyeHeight = isBlinking ? eyeSize * 0.15 : (eyeShape === 'sleepy' ? eyeSize * 0.6 : eyeSize)

  return (
    <Animated.View style={[bodyStyle]}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: faceColor,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          // Glow for celebrate
          ...(animation === 'celebrate' ? {
            shadowColor: faceColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 12,
            elevation: 8,
          } : {}),
          // Red tint for distress
          ...(animation === 'distress' ? {
            borderWidth: 2,
            borderColor: '#F0997B',
          } : {}),
        }}
      >
        {/* Accessory */}
        <Animated.View
          style={[
            accessoryStyle,
            {
              position: 'absolute',
              top: -size * 0.15,
            },
          ]}
        >
          <Text style={{ fontSize: size * 0.3 }}>
            {accessoryEmoji}
          </Text>
        </Animated.View>

        {/* Eyes */}
        <View style={{ flexDirection: 'row', marginTop: size * 0.05, gap: size * 0.15 }}>
          <View
            style={{
              width: eyeSize,
              height: currentEyeHeight,
              borderRadius: isBlinking ? eyeSize : eyeRadius,
              backgroundColor: eyeColor,
            }}
          />
          <View
            style={{
              width: eyeSize,
              height: currentEyeHeight,
              borderRadius: isBlinking ? eyeSize : eyeRadius,
              backgroundColor: eyeColor,
            }}
          />
        </View>

        {/* Mouth */}
        <Text
          style={{
            fontSize: animation === 'distress' ? size * 0.18 : size * 0.2,
            marginTop: size * 0.02,
            color: eyeColor,
          }}
        >
          {currentMouth}
        </Text>

        {/* Celebration sparkles */}
        {animation === 'celebrate' && (
          <>
            <Text style={{ position: 'absolute', top: -size * 0.05, right: -size * 0.1, fontSize: size * 0.15 }}>{'\u2728'}</Text>
            <Text style={{ position: 'absolute', bottom: -size * 0.05, left: -size * 0.1, fontSize: size * 0.12 }}>{'\u2b50'}</Text>
            <Text style={{ position: 'absolute', top: size * 0.3, right: -size * 0.15, fontSize: size * 0.1 }}>{'\u2728'}</Text>
          </>
        )}
      </View>
    </Animated.View>
  )
}
