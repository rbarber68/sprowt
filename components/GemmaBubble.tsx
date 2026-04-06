/**
 * SproutPal — Gemma AI Bubble / Genie Entry Point
 * Displays AI-generated tips. Tap to open Genie chat.
 */

import { View, Text, TouchableOpacity } from 'react-native'

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
    <View style={{
      backgroundColor: '#E6F1FB',
      borderWidth: 1,
      borderColor: '#85B7EB',
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 8,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 18, marginRight: 8 }}>{characterEmoji}</Text>
        <Text style={{ fontSize: 14, fontWeight: '500', color: '#185FA5' }}>
          {characterName ?? 'Sprout Genie'} says:
        </Text>
        {onPress && (
          <Text style={{ marginLeft: 'auto', fontSize: 12, color: '#378ADD' }}>Tap to chat {'\u203a'}</Text>
        )}
      </View>
      {isLoading ? (
        <Text style={{ color: '#9ca3af', fontStyle: 'italic' }}>Thinking...</Text>
      ) : (
        <Text style={{ color: '#374151', fontSize: 14, lineHeight: 20 }}>
          {message ?? 'Tap to ask the Sprout Genie for advice!'}
        </Text>
      )}
    </View>
  )

  if (onPress) {
    return <TouchableOpacity activeOpacity={0.7} onPress={onPress}>{content}</TouchableOpacity>
  }
  return content
}
