/**
 * SproutPal — Genie Chat
 * Bottom sheet chat UI with context-aware suggested questions
 */

import { View, Text, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
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
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
    >
      <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', minHeight: '50%' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, marginRight: 8 }}>{'\ud83e\uddde'}</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#27500A' }}>Sprout Genie</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={handleClose} style={{ padding: 8 }}>
            <Text style={{ fontSize: 20, color: '#9ca3af' }}>{'\u2715'}</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView ref={scrollRef} style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 8 }}>
          {messages.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>{'\ud83e\uddde'}</Text>
              <Text style={{ color: '#3B6D11', fontWeight: '500', textAlign: 'center' }}>
                Welcome to The Great Sprout-Off!{'\n'}Ask me anything about your sprouts!
              </Text>
            </View>
          )}
          {messages.map(msg => (
            <View
              key={msg.id}
              style={{ marginBottom: 12, maxWidth: '85%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
            >
              <View style={{
                borderRadius: 16,
                borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                borderBottomLeftRadius: msg.role === 'user' ? 16 : 4,
                paddingHorizontal: 16,
                paddingVertical: 10,
                backgroundColor: msg.role === 'user' ? '#3B6D11' : '#E6F1FB',
                borderWidth: msg.role === 'user' ? 0 : 1,
                borderColor: msg.role === 'user' ? undefined : '#85B7EB',
              }}>
                <Text style={{ color: msg.role === 'user' ? '#ffffff' : '#374151', fontSize: 14 }}>
                  {msg.content}
                </Text>
              </View>
            </View>
          ))}
          {loading && (
            <View style={{ alignSelf: 'flex-start', marginBottom: 12, maxWidth: '85%' }}>
              <View style={{ backgroundColor: '#E6F1FB', borderWidth: 1, borderColor: '#85B7EB', borderRadius: 16, borderBottomLeftRadius: 4, paddingHorizontal: 16, paddingVertical: 10 }}>
                <Text style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: 14 }}>The Genie is consulting the sprouts...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Suggested questions */}
        {messages.length < 2 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            {suggestions.map(q => (
              <TouchableOpacity
                key={q}
                activeOpacity={0.7}
                style={{ marginRight: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, backgroundColor: '#EAF3DE', borderWidth: 1, borderColor: '#97C459' }}
                onPress={() => sendMessage(q)}
              >
                <Text style={{ color: '#3B6D11', fontSize: 12 }}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
          <TextInput
            style={{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: 9999, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, marginRight: 8 }}
            placeholder="Ask the Genie..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendMessage(input)}
            placeholderTextColor="#999"
            editable={!loading}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            style={{
              width: 40,
              height: 40,
              borderRadius: 9999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: input.trim() && !loading ? '#3B6D11' : '#d1d5db',
            }}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading}
          >
            <Text style={{ color: '#ffffff', fontWeight: '700' }}>{'\u2191'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
