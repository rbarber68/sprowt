/**
 * SproutPal — Harvest Celebration
 * Post-harvest celebration with recipes, nutritional highlights, and character celebration
 */

import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated'
import { useState } from 'react'
import { router } from 'expo-router'
import { CharacterAvatar } from './CharacterAvatar'
import { SpeakButton } from './SpeakButton'
import { GemmaBubble } from './GemmaBubble'
import { getRecipesForSprout, type Recipe } from '@/data/recipes'
import { SPROUT_TYPES } from '@/data/sproutTypes'
import type { PersonalityKey } from '@/data/characters'

interface HarvestCelebrationProps {
  character: {
    name: string
    personality: string
    faceColor: string
    eyeColor: string
    eyeShape: string
    mouth: string
    accessoryEmoji: string
    catchphrase: string
    voiceStyle: string
  }
  beanTypeId: string
  yieldRatio: number | null
  harvestYieldGrams: number | null
  seedAmountGrams: number | null
  userRating: number | null
  gemmaMessage: string | null
  onDone: () => void
  onStartNewBatch: () => void
}

export function HarvestCelebration({
  character,
  beanTypeId,
  yieldRatio,
  harvestYieldGrams,
  seedAmountGrams,
  userRating,
  gemmaMessage,
  onDone,
  onStartNewBatch,
}: HarvestCelebrationProps) {
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null)
  const recipes = getRecipesForSprout(beanTypeId)
  const sproutData = SPROUT_TYPES.find(s => s.id === beanTypeId)
  const personality = character.personality as PersonalityKey

  const celebrationText = yieldRatio
    ? `Incredible harvest! ${harvestYieldGrams} grams from ${seedAmountGrams} grams of seed. That is a ${yieldRatio.toFixed(1)} x yield! ${character.name} is proud!`
    : `Harvest complete! ${character.name} says: ${character.catchphrase}`

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#1a3a0a' }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Celebration header */}
      <Animated.View entering={ZoomIn.duration(500).springify()} style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 16 }}>
        <CharacterAvatar
          faceColor={character.faceColor}
          eyeColor={character.eyeColor}
          eyeShape={character.eyeShape}
          mouth={character.mouth}
          accessoryEmoji={character.accessoryEmoji}
          size={100}
          animation="celebrate"
        />
        <Animated.Text entering={FadeInDown.delay(400).duration(400)} style={{ fontSize: 30, fontWeight: 'bold', color: '#ffffff', marginTop: 16 }}>
          {'\ud83c\udf89'} HARVEST COMPLETE! {'\ud83c\udf89'}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(500).duration(400)} style={{ color: '#97C459', marginTop: 4 }}>
          {character.name}'s {sproutData?.name ?? 'sprout'} journey ends here
        </Animated.Text>
      </Animated.View>

      {/* Yield stats */}
      {yieldRatio && (
        <Animated.View entering={FadeIn.delay(600).duration(400)} style={{ marginHorizontal: 24, marginBottom: 16 }}>
          <View style={{ backgroundColor: 'rgba(39,80,10,0.5)', borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#97C459' }}>{seedAmountGrams}g</Text>
              <Text style={{ fontSize: 12, color: '#639922' }}>Seed in</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, color: '#639922' }}>{'\u2192'}</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#97C459' }}>{harvestYieldGrams}g</Text>
              <Text style={{ fontSize: 12, color: '#639922' }}>Harvested</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#EF9F27' }}>{yieldRatio.toFixed(1)}x</Text>
              <Text style={{ fontSize: 12, color: '#639922' }}>Yield</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Character celebration + speak */}
      <Animated.View entering={FadeIn.delay(700).duration(400)} style={{ marginHorizontal: 24, marginBottom: 16 }}>
        <View style={{ backgroundColor: 'rgba(39,80,10,0.5)', borderRadius: 16, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#97C459', fontWeight: '500' }}>{character.name} says:</Text>
            <SpeakButton text={celebrationText} personality={personality} voiceStyle={character.voiceStyle} size="md" />
          </View>
          <Text style={{ color: '#ffffff', fontStyle: 'italic', lineHeight: 20 }}>
            "{gemmaMessage ?? character.catchphrase}"
          </Text>
        </View>
      </Animated.View>

      {/* Nutritional highlights */}
      {sproutData && (
        <Animated.View entering={FadeIn.delay(800).duration(400)} style={{ marginHorizontal: 24, marginBottom: 16 }}>
          <Text style={{ color: '#639922', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Nutrition highlights</Text>
          <View style={{ backgroundColor: 'rgba(24,95,165,0.3)', borderWidth: 1, borderColor: 'rgba(24,95,165,0.3)', borderRadius: 16, padding: 16 }}>
            <Text style={{ color: '#85B7EB', fontSize: 14, lineHeight: 20 }}>{sproutData.gemmaContext.slice(0, 200)}...</Text>
            <Text style={{ color: '#EF9F27', fontSize: 14, marginTop: 8, fontStyle: 'italic' }}>{sproutData.funFact}</Text>
          </View>
        </Animated.View>
      )}

      {/* Recipe suggestions */}
      <Animated.View entering={FadeIn.delay(900).duration(400)} style={{ marginHorizontal: 24, marginBottom: 16 }}>
        <Text style={{ color: '#639922', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          {'\ud83c\udf73'} Try these recipes with your harvest
        </Text>
        {recipes.map((recipe) => (
          <TouchableOpacity
            key={recipe.id}
            activeOpacity={0.7}
            style={{
              borderRadius: 16,
              marginBottom: 12,
              overflow: 'hidden',
              backgroundColor: expandedRecipe === recipe.id ? '#27500A' : 'rgba(39,80,10,0.5)',
            }}
            onPress={() => setExpandedRecipe(expandedRecipe === recipe.id ? null : recipe.id)}
          >
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>{recipe.title}</Text>
                  <Text style={{ color: '#639922', fontSize: 12, marginTop: 4 }}>
                    {recipe.prepMinutes} min {'\u00b7'} {recipe.tags.join(' \u00b7 ')}
                  </Text>
                </View>
                <Text style={{ color: '#639922', fontSize: 18 }}>
                  {expandedRecipe === recipe.id ? '\u25b2' : '\u25bc'}
                </Text>
              </View>
              <Text style={{ color: '#97C459', fontSize: 14, marginTop: 8 }}>{recipe.description}</Text>
              <Text style={{ color: '#639922', fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>{recipe.nutritionHighlight}</Text>
            </View>

            {expandedRecipe === recipe.id && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: '#3B6D11', paddingTop: 12 }}>
                <Text style={{ color: '#639922', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Ingredients</Text>
                {recipe.ingredients.map((ing, j) => (
                  <Text key={j} style={{ color: '#97C459', fontSize: 14 }}>{'\u2022'} {ing}</Text>
                ))}
                <Text style={{ color: '#639922', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginTop: 12, marginBottom: 8 }}>Steps</Text>
                {recipe.steps.map((s, j) => (
                  <Text key={j} style={{ color: '#97C459', fontSize: 14, marginBottom: 4 }}>{j + 1}. {s}</Text>
                ))}
                <View style={{ marginTop: 12 }}>
                  <SpeakButton
                    text={`Recipe: ${recipe.title}. ${recipe.steps.join('. ')}`}
                    personality={personality}
                    voiceStyle={character.voiceStyle}
                    size="md"
                  />
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Action buttons */}
      <View style={{ marginHorizontal: 24, marginTop: 16, gap: 12 }}>
        <TouchableOpacity activeOpacity={0.7} style={{ backgroundColor: '#97C459', paddingVertical: 16, borderRadius: 12, alignItems: 'center' }} onPress={onStartNewBatch}>
          <Text style={{ color: '#1a3a0a', fontWeight: 'bold', fontSize: 18 }}>Start Another Batch {'\ud83c\udf31'}</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} style={{ paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#3B6D11' }} onPress={onDone}>
          <Text style={{ color: '#97C459', fontWeight: '500' }}>Done</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
