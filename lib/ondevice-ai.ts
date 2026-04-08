/**
 * SproutPal — On-Device AI
 * Runs Gemma 3 1B locally via react-native-executorch
 * Falls back to cloud Gemini API, then static responses
 */

import { getKVStore, setKVStore, KV_KEYS } from './kvstore'

// Gemma 3 1B — exported to PTE format for ExecuTorch mobile inference
// TODO: Replace URLs with your exported model once uploaded to HuggingFace
export const GEMMA3_MODEL = {
  name: 'Gemma 3 1B IT (INT4)',
  // These URLs point to the ExecuTorch-exported PTE model + tokenizer
  // After running the export: update these with your HuggingFace repo URLs
  url: 'https://huggingface.co/rbarber68/gemma3-1b-executorch/resolve/main/model.pte',
  tokenizerUrl: 'https://huggingface.co/google/gemma-3-1b-it/raw/main/tokenizer.json',
  tokenizerConfigUrl: 'https://huggingface.co/google/gemma-3-1b-it/raw/main/tokenizer_config.json',
  size: '~500 MB',
  description: 'Gemma 3 1B — runs locally via ExecuTorch, no internet needed',
}

// State
let _generate: ((messages: Array<{role: string; content: string}>) => Promise<string>) | null = null
let _sendMessage: ((message: string) => Promise<string>) | null = null
let _modelReady = false
let _modelLoading = false
let _downloadProgress = 0

export function isOnDeviceReady(): boolean { return _modelReady }
export function isOnDeviceLoading(): boolean { return _modelLoading }
export function getDownloadProgress(): number { return _downloadProgress }

export function getAiMode(): 'ondevice' | 'cloud' | 'offline' {
  const mode = getKVStore('aiMode')
  if (mode === 'ondevice' || mode === 'cloud' || mode === 'offline') return mode
  const hasApiKey = !!getKVStore(KV_KEYS.GOOGLE_AI_API_KEY)
  if (_modelReady) return 'ondevice'
  if (hasApiKey) return 'cloud'
  return 'offline'
}

export function setAiMode(mode: 'ondevice' | 'cloud' | 'offline') {
  setKVStore('aiMode', mode)
}

/** Called from OnDeviceAI component to sync hook state */
export function syncLlmState(hook: {
  isReady: boolean
  downloadProgress: number
  generate?: any
  sendMessage?: any
}) {
  _modelReady = hook.isReady
  _downloadProgress = hook.downloadProgress
  _generate = hook.generate ?? null
  _sendMessage = hook.sendMessage ?? null
}

export function setModelLoading(loading: boolean) { _modelLoading = loading }

/**
 * Generate using on-device Gemma 3 via ExecuTorch.
 */
export async function generateOnDevice(
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  if (!_modelReady) return ''

  try {
    // react-native-executorch's generate() takes a chat array
    if (_generate) {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ]
      const response = await _generate(messages)
      return (response ?? '').trim()
    }

    // Fallback to sendMessage (managed mode)
    if (_sendMessage) {
      const prompt = `${systemPrompt}\n\nUser: ${userMessage}`
      const response = await _sendMessage(prompt)
      return (response ?? '').trim()
    }

    return ''
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

  // Try on-device first
  if (_modelReady && (mode === 'ondevice' || mode === 'cloud')) {
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

  return { response: '', source: 'offline' }
}
