/**
 * SproutPal — UUID generator
 * Uses expo-crypto for React Native compatibility
 */

import { randomUUID } from 'expo-crypto'

export function uuidv4(): string {
  return randomUUID()
}
