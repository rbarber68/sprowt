/**
 * SproutPal — Achievement Toast
 * Animated popup when an achievement is unlocked
 */

import { View, Text, Modal } from 'react-native'
import { useEffect, useState } from 'react'
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated'
import type { Achievement } from '@/data/achievements'
import { getPlayerLevel } from '@/lib/achievements'

interface AchievementToastProps {
  achievement: Achievement | null
  onDismiss: () => void
}

export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  useEffect(() => {
    if (achievement) {
      const timer = setTimeout(onDismiss, 4000)
      return () => clearTimeout(timer)
    }
  }, [achievement])

  if (!achievement) return null

  const level = getPlayerLevel()

  return (
    <Modal transparent visible={!!achievement} animationType="none" onRequestClose={onDismiss}>
      <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 80 }}>
        <Animated.View
          entering={ZoomIn.springify()}
          exiting={FadeOut.duration(300)}
          style={{
            backgroundColor: '#173404',
            borderRadius: 20,
            padding: 20,
            width: '85%',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: '#97C459',
            shadowColor: '#97C459',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          <Text style={{ fontSize: 40, marginBottom: 8 }}>{achievement.emoji}</Text>
          <Text style={{ fontSize: 12, color: '#639922', textTransform: 'uppercase', letterSpacing: 2 }}>Achievement Unlocked!</Text>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fff', marginTop: 4 }}>{achievement.title}</Text>
          <Text style={{ fontSize: 13, color: '#C0DD97', marginTop: 4 }}>{achievement.description}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 }}>
            <View style={{ backgroundColor: '#3B6D11', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ color: '#C0DD97', fontSize: 12, fontWeight: '600' }}>+{achievement.xp} XP</Text>
            </View>
            <Text style={{ color: '#639922', fontSize: 12 }}>
              {level.emoji} {level.title} (Lv.{level.level})
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: '#97C459', fontStyle: 'italic', marginTop: 10, textAlign: 'center', lineHeight: 18 }}>
            "{achievement.genieAnnouncement}"
          </Text>
        </Animated.View>
      </View>
    </Modal>
  )
}
