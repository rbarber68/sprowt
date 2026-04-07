/**
 * SproutPal — On-Device AI Provider
 * Manages LLM model download and loading via react-native-executorch
 */

import { View, Text, TouchableOpacity } from 'react-native'
import { useState, useEffect } from 'react'
import { setLlmInstance, setModelLoading, setModelReady, isOnDeviceReady } from '@/lib/ondevice-ai'

// Lazy import to avoid crash if native module not built yet
let useLLM: any = null
let LLAMA3_2_1B: any = null
try {
  const rne = require('react-native-executorch')
  useLLM = rne.useLLM
  // Use smallest available model — Llama 3.2 1B or similar
  LLAMA3_2_1B = rne.LLAMA3_2_1B
} catch {
  // Native module not available — will show setup instructions
}

interface OnDeviceAIStatusProps {
  compact?: boolean
}

/**
 * Shows AI model status and download button.
 * Place this in Settings or as a card on Farm View.
 */
export function OnDeviceAIStatus({ compact = false }: OnDeviceAIStatusProps) {
  if (!useLLM) {
    return compact ? null : (
      <View style={{ backgroundColor: '#FAEEDA', borderRadius: 12, padding: 16, margin: 16 }}>
        <Text style={{ color: '#854F0B', fontSize: 13, lineHeight: 20 }}>
          {'\ud83e\udde0'} On-device AI requires a native rebuild. Run: npx expo run:android
        </Text>
      </View>
    )
  }

  return <OnDeviceAIStatusInner compact={compact} />
}

function OnDeviceAIStatusInner({ compact }: { compact: boolean }) {
  const llm = useLLM({ model: LLAMA3_2_1B, preventLoad: true })
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    setLlmInstance(llm)
    setModelReady(llm.isReady)
    setModelLoading(false)
  }, [llm.isReady])

  const handleDownload = async () => {
    setDownloading(true)
    setModelLoading(true)
    try {
      await llm.downloadModel?.()
      await llm.loadModel?.()
    } catch (e) {
      console.warn('Model download failed:', e)
    }
    setDownloading(false)
    setModelLoading(false)
  }

  if (compact) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 12 }}>
          {llm.isReady ? '\ud83e\udde0' : '\ud83d\udcf2'}
        </Text>
        <Text style={{ fontSize: 11, color: llm.isReady ? '#3B6D11' : '#9ca3af' }}>
          {llm.isReady ? 'On-device AI active' : 'Cloud AI'}
        </Text>
      </View>
    )
  }

  return (
    <View style={{ backgroundColor: '#f9fafb', borderRadius: 12, padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 18, marginRight: 8 }}>{'\ud83e\udde0'}</Text>
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#27500A' }}>On-Device AI</Text>
      </View>

      {llm.isReady ? (
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 14 }}>{'\u2705'}</Text>
            <Text style={{ fontSize: 13, color: '#3B6D11' }}>Model loaded — AI runs locally on your device</Text>
          </View>
          <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>No internet needed. Private. Fast.</Text>
        </View>
      ) : downloading ? (
        <View>
          <Text style={{ fontSize: 13, color: '#854F0B' }}>
            {'\u2b07\ufe0f'} Downloading AI model... {Math.round((llm.downloadProgress ?? 0) * 100)}%
          </Text>
          <View style={{ height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, marginTop: 8 }}>
            <View style={{ height: 4, backgroundColor: '#EF9F27', borderRadius: 2, width: `${(llm.downloadProgress ?? 0) * 100}%` }} />
          </View>
          <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>~1.5 GB download. WiFi recommended.</Text>
        </View>
      ) : (
        <View>
          <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 8, lineHeight: 19 }}>
            Download a small AI model to run the Sprout Genie entirely on your device — no internet needed, completely private.
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleDownload}
            style={{ backgroundColor: '#3B6D11', paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{'\ud83e\udde0'} Download AI Model (~1.5 GB)</Text>
          </TouchableOpacity>
        </View>
      )}

      {llm.error && (
        <Text style={{ fontSize: 11, color: '#993C1D', marginTop: 6 }}>Error: {String(llm.error)}</Text>
      )}
    </View>
  )
}
