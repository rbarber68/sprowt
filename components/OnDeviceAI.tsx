/**
 * SproutPal — On-Device AI Provider
 * Downloads and runs Gemma 3 1B locally via react-native-executorch
 */

import { View, Text, TouchableOpacity } from 'react-native'
import { useEffect, useState } from 'react'
import { GEMMA3_MODEL, syncLlmState, setModelLoading } from '@/lib/ondevice-ai'

// Lazy import — native module needs a native rebuild
let useLLM: any = null
try {
  useLLM = require('react-native-executorch').useLLM
} catch {
  // Native module not available yet
}

interface OnDeviceAIStatusProps {
  compact?: boolean
}

export function OnDeviceAIStatus({ compact = false }: OnDeviceAIStatusProps) {
  if (!useLLM) {
    return compact ? null : (
      <View style={{ backgroundColor: '#FAEEDA', borderRadius: 12, padding: 16 }}>
        <Text style={{ color: '#854F0B', fontSize: 13, lineHeight: 20 }}>
          {'\ud83e\udde0'} On-device AI needs a native rebuild.{'\n'}
          Run: npx expo run:android
        </Text>
      </View>
    )
  }

  return <OnDeviceAIInner compact={compact} />
}

function OnDeviceAIInner({ compact }: { compact: boolean }) {
  const llm = useLLM({
    model: {
      modelSource: GEMMA3_MODEL.url,
      tokenizerSource: GEMMA3_MODEL.tokenizerUrl,
      tokenizerConfigSource: GEMMA3_MODEL.tokenizerConfigUrl,
    },
  })

  const [error, setError] = useState<string | null>(null)

  // Sync LLM state to our module
  useEffect(() => {
    syncLlmState({
      isReady: llm.isReady ?? false,
      downloadProgress: llm.downloadProgress ?? 0,
      generate: llm.generate,
      sendMessage: llm.sendMessage,
    })
  }, [llm.isReady, llm.downloadProgress])

  useEffect(() => {
    if (llm.error) setError(String(llm.error))
  }, [llm.error])

  if (compact) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 12 }}>
          {llm.isReady ? '\ud83e\udde0' : llm.downloadProgress > 0 ? '\u2b07\ufe0f' : '\u2601\ufe0f'}
        </Text>
        <Text style={{ fontSize: 11, color: llm.isReady ? '#3B6D11' : '#9ca3af' }}>
          {llm.isReady ? 'Gemma 3 active (on-device)' : llm.downloadProgress > 0 ? `Downloading ${Math.round(llm.downloadProgress)}%` : 'Cloud AI'}
        </Text>
      </View>
    )
  }

  return (
    <View style={{ backgroundColor: '#f9fafb', borderRadius: 12, padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 20, marginRight: 8 }}>{'\ud83e\udde0'}</Text>
        <View>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#27500A' }}>On-Device AI</Text>
          <Text style={{ fontSize: 11, color: '#9ca3af' }}>{GEMMA3_MODEL.description}</Text>
        </View>
      </View>

      {llm.isReady ? (
        <View style={{ backgroundColor: '#EAF3DE', borderRadius: 10, padding: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 16 }}>{'\u2705'}</Text>
            <Text style={{ fontSize: 14, color: '#3B6D11', fontWeight: '600' }}>Gemma 3 loaded!</Text>
          </View>
          <Text style={{ fontSize: 12, color: '#639922', marginTop: 4 }}>
            AI runs entirely on your device. No internet needed. Private and fast.
          </Text>
        </View>
      ) : llm.downloadProgress > 0 && llm.downloadProgress < 100 ? (
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: 13, color: '#854F0B' }}>{'\u2b07\ufe0f'} Downloading Gemma 3...</Text>
            <Text style={{ fontSize: 13, color: '#854F0B', fontWeight: '600' }}>{Math.round(llm.downloadProgress)}%</Text>
          </View>
          <View style={{ height: 6, backgroundColor: '#e5e7eb', borderRadius: 3 }}>
            <View style={{ height: 6, backgroundColor: '#EF9F27', borderRadius: 3, width: `${llm.downloadProgress}%` }} />
          </View>
          <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
            {GEMMA3_MODEL.size} download. WiFi recommended. One-time only.
          </Text>
        </View>
      ) : (
        <View>
          <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 12, lineHeight: 20 }}>
            Gemma 3 will download automatically when ready. The model runs the Sprout Genie
            entirely on your device — no internet needed, completely private.
          </Text>
          <View style={{ backgroundColor: '#E6F1FB', borderRadius: 10, padding: 10 }}>
            <Text style={{ fontSize: 12, color: '#185FA5', lineHeight: 18 }}>
              {'\ud83d\udca1'} Model: {GEMMA3_MODEL.name}{'\n'}
              Size: {GEMMA3_MODEL.size}{'\n'}
              Works on most phones from 2023+ with 6GB+ RAM
            </Text>
          </View>
        </View>
      )}

      {error && (
        <View style={{ backgroundColor: '#FAECE7', borderRadius: 8, padding: 10, marginTop: 8 }}>
          <Text style={{ fontSize: 12, color: '#993C1D' }}>{error}</Text>
        </View>
      )}
    </View>
  )
}
