/**
 * SproutPal — Genie Chat
 * Bottom sheet chat UI with context-aware suggested questions
 */

import { View, Text, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useState, useEffect, useRef } from 'react'
import { chatWithGenie, getRecentMessages, summarizeAndPrune } from '@/lib/genie'

interface GenieChatProps {
  visible: boolean
  onClose: () => void
  screenContext?: { screen: string; batchId?: string }
}

const SUGGESTED_QUESTIONS: Record<string, string[]> = {
  farm: ["How's my farm doing?", "What should I start next?", "Give me the season recap!"],
  batch: ["Tips for this batch?", "Compare to my history", "What's my contestant's chances?"],
  performance: ["What's my best setup?", "How can I improve?", "Rank my contestants!"],
  default: ["What should I grow?", "Give me a tip!", "How's my farm?"],
}

interface ChatMessage {
  id: string
  role: string
  content: string
  createdAt: number
}

export function GenieChat({ visible, onClose, screenContext }: GenieChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  const suggestions = SUGGESTED_QUESTIONS[screenContext?.screen ?? 'default'] ?? SUGGESTED_QUESTIONS.default

  useEffect(() => {
    if (visible) {
      getRecentMessages(30).then(msgs => {
        setMessages(msgs.reverse())
      })
    }
  }, [visible])

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
  }, [messages.length])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      createdAt: Date.now(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await chatWithGenie(text.trim(), screenContext)
      const genieMsg: ChatMessage = {
        id: `genie-${Date.now()}`,
        role: 'genie',
        content: response,
        createdAt: Date.now(),
      }
      setMessages(prev => [...prev, genieMsg])
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'genie',
        content: "The Genie got stage fright! Try again in a moment.",
        createdAt: Date.now(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleClose = async () => {
    try { await summarizeAndPrune() } catch {}
    onClose()
  }

  if (!visible) return null

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="absolute inset-0 bg-black/40 justify-end"
    >
      <View className="bg-white rounded-t-3xl max-h-[80%] min-h-[50%]">
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-100">
          <View className="flex-row items-center">
            <Text className="text-xl mr-2">{'\ud83e\uddde'}</Text>
            <Text className="text-lg font-bold text-sprout-800">Sprout Genie</Text>
          </View>
          <Pressable onPress={handleClose} className="p-2">
            <Text className="text-xl text-gray-400">{'\u2715'}</Text>
          </Pressable>
        </View>

        {/* Messages */}
        <ScrollView ref={scrollRef} className="flex-1 px-4 py-2">
          {messages.length === 0 && (
            <View className="items-center py-8">
              <Text className="text-4xl mb-2">{'\ud83e\uddde'}</Text>
              <Text className="text-sprout-600 font-medium text-center">
                Welcome to The Great Sprout-Off!{'\n'}Ask me anything about your sprouts!
              </Text>
            </View>
          )}
          {messages.map(msg => (
            <View
              key={msg.id}
              className={`mb-3 max-w-[85%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}
            >
              <View className={`rounded-2xl px-4 py-2.5 ${
                msg.role === 'user'
                  ? 'bg-sprout-600 rounded-br-sm'
                  : 'bg-info-50 border border-info-200 rounded-bl-sm'
              }`}>
                <Text className={msg.role === 'user' ? 'text-white text-sm' : 'text-gray-700 text-sm'}>
                  {msg.content}
                </Text>
              </View>
            </View>
          ))}
          {loading && (
            <View className="self-start mb-3 max-w-[85%]">
              <View className="bg-info-50 border border-info-200 rounded-2xl rounded-bl-sm px-4 py-2.5">
                <Text className="text-gray-400 italic text-sm">The Genie is consulting the sprouts...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Suggested questions */}
        {messages.length < 2 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pb-2">
            {suggestions.map(q => (
              <Pressable
                key={q}
                className="mr-2 px-3 py-1.5 rounded-chip bg-sprout-50 border border-sprout-200"
                onPress={() => sendMessage(q)}
              >
                <Text className="text-sprout-600 text-xs">{q}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Input */}
        <View className="flex-row items-center px-4 py-3 border-t border-gray-100">
          <TextInput
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm mr-2"
            placeholder="Ask the Genie..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendMessage(input)}
            placeholderTextColor="#999"
            editable={!loading}
          />
          <Pressable
            className={`w-10 h-10 rounded-full items-center justify-center ${
              input.trim() && !loading ? 'bg-sprout-600' : 'bg-gray-300'
            }`}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading}
          >
            <Text className="text-white font-bold">{'\u2191'}</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
