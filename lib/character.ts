/**
 * SproutPal — Character Generation and Storage
 */

import { uuidv4 } from './uuid'
import { db } from '@/db/client'
import { characters } from '@/db/schema'
import { generateCharacter, type CharacterTraits } from '@/data/characters'

export async function createCharacter(beanTypeId: string): Promise<CharacterTraits> {
  const traits = generateCharacter(beanTypeId)
  const id = uuidv4()
  const character: CharacterTraits = { id, ...traits }

  await db.insert(characters).values({
    id,
    name: traits.name,
    personality: traits.personality,
    voiceStyle: traits.voiceStyle,
    waterAttitude: traits.waterAttitude,
    harvestAttitude: traits.harvestAttitude,
    secretFear: traits.secretFear,
    hiddenTalent: traits.hiddenTalent,
    catchphrase: traits.catchphrase,
    rarity: traits.rarity,
    faceColor: traits.faceColor,
    eyeColor: traits.eyeColor,
    eyeShape: traits.eyeShape,
    mouth: traits.mouth,
    accessoryEmoji: traits.accessoryEmoji,
    accessoryName: traits.accessoryName,
    traitsJson: JSON.stringify(character),
  })

  return character
}
