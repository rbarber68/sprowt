/**
 * SproutPal — Character Profile
 * Personality-themed homepage for each sprout character
 */

import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useLocalSearchParams, router, Stack } from 'expo-router'
import { useEffect, useState } from 'react'
import { db } from '@/db/client'
import { batches, characters, beanTypes, dailyLogs } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { CharacterAvatar } from '@/components/CharacterAvatar'
import { SpeakButton } from '@/components/SpeakButton'
import { getTheme } from '@/data/personalityThemes'
import { getRecipesForSprout } from '@/data/recipes'
import { SPROUT_TYPES } from '@/data/sproutTypes'
import { HARVEST_FAREWELLS, PERSONALITIES, type PersonalityKey } from '@/data/characters'

export default function CharacterProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [character, setCharacter] = useState<typeof characters.$inferSelect | null>(null)
  const [batch, setBatch] = useState<typeof batches.$inferSelect | null>(null)
  const [beanType, setBeanType] = useState<typeof beanTypes.$inferSelect | null>(null)
  const [rinseCount, setRinseCount] = useState(0)

  useEffect(() => {
    if (!id) return
    loadProfile()
  }, [id])

  const loadProfile = async () => {
    const [row] = await db.select().from(batches)
      .innerJoin(characters, eq(batches.characterId, characters.id))
      .innerJoin(beanTypes, eq(batches.beanTypeId, beanTypes.id))
      .where(eq(characters.id, id))
      .limit(1)

    if (row) {
      setCharacter(row.characters)
      setBatch(row.batches)
      setBeanType(row.bean_types)

      const logs = await db.select().from(dailyLogs)
        .where(and(eq(dailyLogs.batchId, row.batches.id), eq(dailyLogs.logType, 'rinse')))
      setRinseCount(logs.length)
    }
  }

  if (!character || !batch || !beanType) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#173404' }}>
        <Text style={{ color: '#639922' }}>Loading...</Text>
      </View>
    )
  }

  const personality = character.personality as PersonalityKey
  const theme = getTheme(personality)
  const personalityInfo = PERSONALITIES[personality]
  const farewell = HARVEST_FAREWELLS[personality]
  const recipes = getRecipesForSprout(beanType.id)
  const now = Date.now()
  const dayNumber = Math.max(0, Math.floor((now - batch.soakStartAt) / 86400000))
  const totalDays = Math.ceil((beanType.soakHours / 24) + beanType.growDays)
  const progress = Math.min(dayNumber / totalDays, 1)

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: theme.bgPrimary }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Hero header */}
          <View style={{ alignItems: 'center', paddingTop: 56, paddingBottom: 24, paddingHorizontal: 24 }}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.back()}
              style={{ position: 'absolute', top: 48, left: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: theme.bgSecondary, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: theme.textPrimary, fontSize: 20 }}>{'\u2190'}</Text>
            </TouchableOpacity>

            <View style={{ position: 'absolute', top: 40, right: 20, flexDirection: 'row', gap: 4 }}>
              {theme.headerEmojis.map((e, i) => (
                <Text key={i} style={{ fontSize: 18, opacity: 0.5 }}>{e}</Text>
              ))}
            </View>

            <View style={{
              width: 160, height: 160, borderRadius: 80,
              backgroundColor: theme.accent + '20',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 3, borderColor: theme.accent,
              shadowColor: theme.accent, shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5, shadowRadius: 24, elevation: 12,
            }}>
              <CharacterAvatar
                faceColor={character.faceColor}
                eyeColor={character.eyeColor}
                eyeShape={character.eyeShape}
                mouth={character.mouth}
                accessoryEmoji={character.accessoryEmoji}
                size={110}
                animation={batch.status === 'ready' ? 'celebrate' : 'idle'}
              />
            </View>

            <Text style={{ fontSize: 28, fontWeight: 'bold', color: theme.textPrimary, marginTop: 16 }}>
              {character.name}
            </Text>
            <Text style={{ fontSize: 15, color: theme.accent, marginTop: 4, fontWeight: '600' }}>
              {personalityInfo.label}
            </Text>
            <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 2 }}>
              {personalityInfo.description}
            </Text>
          </View>

          {/* Greeting card */}
          <View style={{ marginHorizontal: 20, backgroundColor: theme.bgCard, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: theme.borderColor + '40' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: theme.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Welcome message</Text>
              <SpeakButton text={theme.homeGreeting} personality={personality} voiceStyle={character.voiceStyle} size="sm" />
            </View>
            <Text style={{ color: theme.textPrimary, fontSize: 16, fontStyle: 'italic', marginTop: 8, lineHeight: 24 }}>
              "{theme.homeGreeting}"
            </Text>
          </View>

          {/* Stats row */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 }}>
            <View style={{ flex: 1, backgroundColor: theme.bgCard, borderRadius: 14, padding: 14, alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.accent }}>{dayNumber}</Text>
              <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 2 }}>Days Old</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: theme.bgCard, borderRadius: 14, padding: 14, alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.accent }}>{rinseCount}</Text>
              <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 2 }}>Rinses</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: theme.bgCard, borderRadius: 14, padding: 14, alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.accent }}>{Math.round(progress * 100)}%</Text>
              <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 2 }}>Complete</Text>
            </View>
          </View>

          {/* Personality traits */}
          <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
            <Text style={{ fontSize: 11, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Personality File
            </Text>
            {[
              { icon: '\ud83c\udf99\ufe0f', label: 'Voice Style', value: character.voiceStyle },
              { icon: '\ud83d\udca7', label: 'Water Attitude', value: character.waterAttitude },
              { icon: '\ud83c\udf3e', label: 'Harvest Attitude', value: character.harvestAttitude },
              { icon: '\ud83d\ude28', label: 'Secret Fear', value: character.secretFear },
              { icon: '\u2728', label: 'Hidden Talent', value: character.hiddenTalent },
            ].map((trait, i) => (
              <View key={i} style={{ backgroundColor: theme.bgCard, borderRadius: 12, padding: 14, marginBottom: 6, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, marginRight: 12 }}>{trait.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{trait.label}</Text>
                  <Text style={{ fontSize: 14, color: theme.textPrimary, marginTop: 2 }}>{trait.value}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Catchphrase */}
          <View style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: theme.accent + '15', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.accent + '30' }}>
            <Text style={{ fontSize: 11, color: theme.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Catchphrase</Text>
            <Text style={{ fontSize: 18, color: theme.textPrimary, fontStyle: 'italic', lineHeight: 26, textAlign: 'center' }}>
              "{character.catchphrase}"
            </Text>
            <View style={{ alignItems: 'center', marginTop: 10 }}>
              <SpeakButton text={character.catchphrase} personality={personality} voiceStyle={character.voiceStyle} size="md" />
            </View>
          </View>

          {/* Growing info */}
          <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
            <Text style={{ fontSize: 11, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Growing {beanType.emoji} {beanType.name}
            </Text>
            <View style={{ backgroundColor: theme.bgCard, borderRadius: 14, padding: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Progress</Text>
                <Text style={{ color: theme.accent, fontSize: 13, fontWeight: 'bold' }}>Day {dayNumber} of {totalDays}</Text>
              </View>
              <View style={{ height: 8, backgroundColor: theme.bgPrimary, borderRadius: 4 }}>
                <View style={{ height: 8, backgroundColor: theme.accent, borderRadius: 4, width: `${progress * 100}%` }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <View>
                  <Text style={{ color: theme.textMuted, fontSize: 10 }}>Status</Text>
                  <Text style={{ color: theme.textPrimary, fontSize: 14, textTransform: 'capitalize', fontWeight: '600' }}>{batch.status}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: theme.textMuted, fontSize: 10 }}>Jar</Text>
                  <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '600' }}>{batch.jarLabel}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Harvest farewell preview */}
          <View style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: theme.bgCard, borderRadius: 14, padding: 16 }}>
            <Text style={{ fontSize: 11, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              {batch.status === 'harvested' ? 'Farewell Speech' : 'When Harvest Comes...'}
            </Text>
            <Text style={{ color: theme.accent, fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>{farewell.title}</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 20, fontStyle: 'italic' }}>"{farewell.body}"</Text>
          </View>

          {/* Favorite recipes */}
          {recipes.length > 0 && (
            <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
              <Text style={{ fontSize: 11, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                {character.name}'s Recipe Picks
              </Text>
              {recipes.slice(0, 3).map((recipe) => (
                <View key={recipe.id} style={{ backgroundColor: theme.bgCard, borderRadius: 12, padding: 14, marginBottom: 6 }}>
                  <Text style={{ color: theme.textPrimary, fontWeight: '600', fontSize: 14 }}>{recipe.title}</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>{recipe.prepMinutes} min {'\u00b7'} {recipe.tags.join(' \u00b7 ')}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Vibe */}
          <View style={{ marginHorizontal: 20, alignItems: 'center', paddingVertical: 20 }}>
            <Text style={{ fontSize: 32 }}>{theme.headerEmojis[0]}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 13, fontStyle: 'italic', marginTop: 8, textAlign: 'center' }}>
              "{theme.vibe}"
            </Text>
          </View>
        </ScrollView>

        {/* Bottom action */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 32, paddingTop: 8 }}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/batch/[id]', params: { id: batch.id } })}
            style={{ backgroundColor: theme.accent, paddingVertical: 14, borderRadius: 14, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>View Batch Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  )
}
