/**
 * SproutPal — Gemma AI Bubble / Genie Entry Point
 * Displays AI-generated tips. Tap to open Genie chat.
 */

import { View, Text, Pressable } from 'react-native'

interface GemmaBubbleProps {
  message?: string
  characterName?: string
  characterEmoji?: string
  isLoading?: boolean
  onPress?: () => void
}

export function GemmaBubble({
  message,
  characterName,
  characterEmoji = '\ud83e\uddde',
  isLoading = false,
  onPress,
}: GemmaBubbleProps) {
  const content = (
    <View className="bg-info-50 border border-info-200 rounded-card p-4 mx-4 my-2">
      <View className="flex-row items-center mb-2">
        <Text className="text-lg mr-2">{characterEmoji}</Text>
        <Text className="text-sm font-medium text-info-600">
          {characterName ?? 'Sprout Genie'} says:
        </Text>
        {onPress && (
          <Text className="ml-auto text-xs text-info-400">Tap to chat {'\u203a'}</Text>
        )}
      </View>
      {isLoading ? (
        <Text className="text-gray-400 italic">Thinking...</Text>
      ) : (
        <Text className="text-gray-700 text-sm leading-5">
          {message ?? 'Tap to ask the Sprout Genie for advice!'}
        </Text>
      )}
    </View>
  )

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>
  }
  return content
}
