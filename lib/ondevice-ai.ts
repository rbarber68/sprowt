/**
 * SproutPal — On-Device AI
 * Runs Gemma/LLM locally via react-native-executorch
 * Falls back to cloud Gemini API, then static responses
 */

import { getKVStore, setKVStore, KV_KEYS } from './kvstore'

// Model status tracking
let _modelReady = false
let _modelLoading = false
let _llmInstance: any = null

/**
 * Check if on-device AI is available and loaded
 */
export function isOnDeviceReady(): boolean {
  return _modelReady
}

export function isOnDeviceLoading(): boolean {
  return _modelLoading
}

/**
 * Get the preferred AI mode
 */
export function getAiMode(): 'ondevice' | 'cloud' | 'offline' {
  const mode = getKVStore('aiMode')
  if (mode === 'ondevice' || mode === 'cloud' || mode === 'offline') return mode
  // Auto-detect: prefer cloud if key exists, then ondevice, then offline
  const hasApiKey = !!getKVStore(KV_KEYS.GOOGLE_AI_API_KEY)
  if (hasApiKey) return 'cloud'
  if (_modelReady) return 'ondevice'
  return 'offline'
}

export function setAiMode(mode: 'ondevice' | 'cloud' | 'offline') {
  setKVStore('aiMode', mode)
}

/**
 * Initialize the on-device LLM model.
 * This downloads the model (~1.5GB) on first use.
 * Call from a component using the useLLM hook.
 */
export function setLlmInstance(instance: any) {
  _llmInstance = instance
  _modelReady = instance?.isReady ?? false
}

export function setModelLoading(loading: boolean) {
  _modelLoading = loading
}

export function setModelReady(ready: boolean) {
  _modelReady = ready
}

/**
 * Generate a response using on-device AI.
 * Returns empty string if model not ready.
 */
export async function generateOnDevice(
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  if (!_llmInstance || !_modelReady) return ''

  try {
    const chat = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userMessage },
    ]
    const response = await _llmInstance.generate(chat)
    return response ?? ''
  } catch (e) {
    console.warn('On-device AI error:', e)
    return ''
  }
}

/**
 * Unified AI call — tries on-device first, then cloud, then offline.
 */
export async function unifiedAiCall(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 120,
): Promise<{ response: string; source: 'ondevice' | 'cloud' | 'offline' }> {
  const mode = getAiMode()

  // Try on-device first (if preferred and ready)
  if ((mode === 'ondevice' || mode === 'cloud') && _modelReady) {
    const response = await generateOnDevice(systemPrompt, userMessage)
    if (response) return { response, source: 'ondevice' }
  }

  // Try cloud API
  if (mode === 'ondevice' || mode === 'cloud') {
    try {
      const { callGemma } = require('./gemma')
      const response = await callGemma(systemPrompt, userMessage, maxTokens)
      if (response) return { response, source: 'cloud' }
    } catch {}
  }

  // Offline fallback
  return { response: '', source: 'offline' }
}
