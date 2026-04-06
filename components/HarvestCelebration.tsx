/**
 * SproutPal — Harvest Celebration
 * Post-harvest celebration with recipes, nutritional highlights, and character celebration
 */

import { View, Text, Pressable, ScrollView } from 'react-native'
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
    <ScrollView className="flex-1 bg-sprout-900" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Celebration header */}
      <Animated.View entering={ZoomIn.duration(500).springify()} className="items-center pt-8 pb-4">
        <CharacterAvatar
          faceColor={character.faceColor}
          eyeColor={character.eyeColor}
          eyeShape={character.eyeShape}
          mouth={character.mouth}
          accessoryEmoji={character.accessoryEmoji}
          size={100}
          animation="celebrate"
        />
        <Animated.Text entering={FadeInDown.delay(400).duration(400)} className="text-3xl font-bold text-white mt-4">
          {'\ud83c\udf89'} HARVEST COMPLETE! {'\ud83c\udf89'}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(500).duration(400)} className="text-sprout-200 mt-1">
          {character.name}'s {sproutData?.name ?? 'sprout'} journey ends here
        </Animated.Text>
      </Animated.View>

      {/* Yield stats */}
      {yieldRatio && (
        <Animated.View entering={FadeIn.delay(600).duration(400)} className="mx-6 mb-4">
          <View className="bg-sprout-800/50 rounded-2xl p-5 flex-row justify-around">
            <View className="items-center">
              <Text className="text-2xl font-bold text-sprout-200">{seedAmountGrams}g</Text>
              <Text className="text-xs text-sprout-400">Seed in</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl text-sprout-400">{'\u2192'}</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-sprout-200">{harvestYieldGrams}g</Text>
              <Text className="text-xs text-sprout-400">Harvested</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-soak-200">{yieldRatio.toFixed(1)}x</Text>
              <Text className="text-xs text-sprout-400">Yield</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Character celebration + speak */}
      <Animated.View entering={FadeIn.delay(700).duration(400)} className="mx-6 mb-4">
        <View className="bg-sprout-800/50 rounded-2xl p-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sprout-200 font-medium">{character.name} says:</Text>
            <SpeakButton text={celebrationText} personality={personality} voiceStyle={character.voiceStyle} size="md" />
          </View>
          <Text className="text-white italic leading-5">
            "{gemmaMessage ?? character.catchphrase}"
          </Text>
        </View>
      </Animated.View>

      {/* Nutritional highlights */}
      {sproutData && (
        <Animated.View entering={FadeIn.delay(800).duration(400)} className="mx-6 mb-4">
          <Text className="text-sprout-400 text-xs uppercase tracking-wider mb-2">Nutrition highlights</Text>
          <View className="bg-info-800/30 border border-info-600/30 rounded-2xl p-4">
            <Text className="text-info-200 text-sm leading-5">{sproutData.gemmaContext.slice(0, 200)}...</Text>
            <Text className="text-soak-200 text-sm mt-2 italic">{sproutData.funFact}</Text>
          </View>
        </Animated.View>
      )}

      {/* Recipe suggestions */}
      <Animated.View entering={FadeIn.delay(900).duration(400)} className="mx-6 mb-4">
        <Text className="text-sprout-400 text-xs uppercase tracking-wider mb-3">
          {'\ud83c\udf73'} Try these recipes with your harvest
        </Text>
        {recipes.map((recipe) => (
          <Pressable
            key={recipe.id}
            className={`rounded-2xl mb-3 overflow-hidden ${
              expandedRecipe === recipe.id ? 'bg-sprout-800' : 'bg-sprout-800/50'
            }`}
            onPress={() => setExpandedRecipe(expandedRecipe === recipe.id ? null : recipe.id)}
          >
            <View className="p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white font-bold">{recipe.title}</Text>
                  <Text className="text-sprout-400 text-xs mt-1">
                    {recipe.prepMinutes} min {'\u00b7'} {recipe.tags.join(' \u00b7 ')}
                  </Text>
                </View>
                <Text className="text-sprout-400 text-lg">
                  {expandedRecipe === recipe.id ? '\u25b2' : '\u25bc'}
                </Text>
              </View>
              <Text className="text-sprout-200 text-sm mt-2">{recipe.description}</Text>
              <Text className="text-sprout-400 text-xs italic mt-1">{recipe.nutritionHighlight}</Text>
            </View>

            {expandedRecipe === recipe.id && (
              <View className="px-4 pb-4 border-t border-sprout-700 pt-3">
                <Text className="text-sprout-400 text-xs uppercase tracking-wider mb-2">Ingredients</Text>
                {recipe.ingredients.map((ing, j) => (
                  <Text key={j} className="text-sprout-200 text-sm">{'\u2022'} {ing}</Text>
                ))}
                <Text className="text-sprout-400 text-xs uppercase tracking-wider mt-3 mb-2">Steps</Text>
                {recipe.steps.map((s, j) => (
                  <Text key={j} className="text-sprout-200 text-sm mb-1">{j + 1}. {s}</Text>
                ))}
                <View className="mt-3">
                  <SpeakButton
                    text={`Recipe: ${recipe.title}. ${recipe.steps.join('. ')}`}
                    personality={personality}
                    voiceStyle={character.voiceStyle}
                    size="md"
                  />
                </View>
              </View>
            )}
          </Pressable>
        ))}
      </Animated.View>

      {/* Action buttons */}
      <View className="mx-6 mt-4 gap-3">
        <Pressable className="bg-sprout-200 py-4 rounded-xl items-center" onPress={onStartNewBatch}>
          <Text className="text-sprout-900 font-bold text-lg">Start Another Batch {'\ud83c\udf31'}</Text>
        </Pressable>
        <Pressable className="py-3 rounded-xl items-center border border-sprout-600" onPress={onDone}>
          <Text className="text-sprout-200 font-medium">Done</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}
