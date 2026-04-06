/**
 * SproutPal — Sound Effects
 * Preload and play bundled audio at key moments
 */

import { Audio } from 'expo-av'
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

const loaded: Partial<Record<SoundName, Audio.Sound>> = {}

export async function preloadSounds(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true })
    for (const [name, file] of Object.entries(SOUND_FILES)) {
      const { sound } = await Audio.Sound.createAsync(file, { shouldPlay: false })
      loaded[name as SoundName] = sound
    }
  } catch (e) {
    console.warn('Sound preload failed:', e)
  }
}

export async function playSound(name: SoundName): Promise<void> {
  try {
    const muted = getKVStore(KV_KEYS.SOUNDS_MUTED) === 'true'
    if (muted) return

    const sound = loaded[name]
    if (sound) {
      await sound.setPositionAsync(0)
      await sound.playAsync()
    }
  } catch {
    // Sound failure should never crash the app
  }
}

export async function unloadSounds(): Promise<void> {
  for (const sound of Object.values(loaded)) {
    if (sound) await sound.unloadAsync()
  }
}
