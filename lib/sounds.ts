/**
 * SproutPal — Sound Effects
 * Preload and play bundled audio at key moments
 * Uses expo-audio (expo-av is deprecated in SDK 54)
 */

import { createAudioPlayer, AudioPlayer } from 'expo-audio'
import { getKVStore, KV_KEYS } from './kvstore'

type SoundName =
  | 'dice-roll' | 'tada' | 'water-splash' | 'celebration-fanfare'
  | 'soft-chime' | 'dice-shake' | 'alert-tone'

const SOUND_FILES: Record<SoundName, any> = {
  'dice-roll':            require('@/assets/sounds/dice-roll.mp3'),
  'tada':                 require('@/assets/sounds/tada.mp3'),
  'water-splash':         require('@/assets/sounds/water-splash.mp3'),
  'celebration-fanfare':  require('@/assets/sounds/celebration-fanfare.mp3'),
  'soft-chime':           require('@/assets/sounds/soft-chime.mp3'),
  'dice-shake':           require('@/assets/sounds/dice-shake.mp3'),
  'alert-tone':           require('@/assets/sounds/alert-tone.mp3'),
}

const players: Partial<Record<SoundName, AudioPlayer>> = {}

export async function preloadSounds(): Promise<void> {
  try {
    for (const [name, source] of Object.entries(SOUND_FILES)) {
      players[name as SoundName] = createAudioPlayer(source)
    }
  } catch (e) {
    console.warn('Sound preload failed:', e)
  }
}

export async function playSound(name: SoundName): Promise<void> {
  try {
    const muted = getKVStore(KV_KEYS.SOUNDS_MUTED) === 'true'
    if (muted) return

    const player = players[name]
    if (player) {
      player.seekTo(0)
      player.play()
    }
  } catch {
    // Sound failure should never crash the app
  }
}

export async function unloadSounds(): Promise<void> {
  for (const player of Object.values(players)) {
    if (player) player.remove()
  }
}
