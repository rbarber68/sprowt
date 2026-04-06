import { View, Text, Pressable, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { useState, useCallback } from 'react'
import { uuidv4 } from '@/lib/uuid'
import { SPROUT_TYPES, TRAY_SPROUTS } from '@/data/sproutTypes'
import { generateCharacter, type CharacterTraits } from '@/data/characters'
import { CharacterAvatar } from '@/components/CharacterAvatar'
import { setKVStore, KV_KEYS } from '@/lib/kvstore'
import { requestNotificationPermission } from '@/lib/notifications'
import { db } from '@/db/client'
import { batches, characters } from '@/db/schema'

type OnboardingStep = 0 | 1 | 2 | 3 | 4

export default function OnboardingScreen() {
  const [step, setStep] = useState<OnboardingStep>(0)
  const [selectedBeanId, setSelectedBeanId] = useState<string | null>(null)
  const [character, setCharacter] = useState<Omit<CharacterTraits, 'id'> & { personalityLabel: string } | null>(null)
  const [notifGranted, setNotifGranted] = useState<boolean | null>(null)

  const jarSprouts = SPROUT_TYPES.filter(s => !TRAY_SPROUTS.includes(s.id)).slice(0, 6)

  const rollCharacter = useCallback(() => {
    if (!selectedBeanId) return
    setCharacter(generateCharacter(selectedBeanId))
  }, [selectedBeanId])

  const completeOnboarding = async () => {
    setKVStore(KV_KEYS.ONBOARDING_COMPLETE, 'true')

    // Create first batch if sprout and character selected
    if (selectedBeanId && character) {
      const bean = SPROUT_TYPES.find(s => s.id === selectedBeanId)!
      const batchId = uuidv4()
      const characterId = uuidv4()
      const now = Date.now()

      await db.insert(characters).values({
        id: characterId,
        name: character.name,
        personality: character.personality,
        voiceStyle: character.voiceStyle,
        waterAttitude: character.waterAttitude,
        harvestAttitude: character.harvestAttitude,
        secretFear: character.secretFear,
        hiddenTalent: character.hiddenTalent,
        catchphrase: character.catchphrase,
        rarity: character.rarity,
        faceColor: character.faceColor,
        eyeColor: character.eyeColor,
        eyeShape: character.eyeShape,
        mouth: character.mouth,
        accessoryEmoji: character.accessoryEmoji,
        accessoryName: character.accessoryName,
        traitsJson: JSON.stringify(character),
      })

      await db.insert(batches).values({
        id: batchId,
        beanTypeId: bean.id,
        characterId,
        jarLabel: 'Jar A',
        status: 'soaking',
        soakStartAt: now,
        jarStartAt: now + bean.soakHours * 3600000,
        targetHarvestAt: now + (bean.soakHours / 24 + bean.growDays) * 86400000,
        createdAt: now,
        updatedAt: now,
      })
    }

    router.replace('/(tabs)')
  }

  const skipOnboarding = () => {
    setKVStore(KV_KEYS.ONBOARDING_COMPLETE, 'true')
    router.replace('/(tabs)')
  }

  return (
    <View className="flex-1 bg-sprout-50">
      {/* Step 0: Welcome */}
      {step === 0 && (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-8xl mb-6">🌱</Text>
          <Text className="text-3xl font-bold text-sprout-800 mb-3">Meet SproutPal</Text>
          <Text className="text-lg text-sprout-600 text-center mb-10 leading-7">
            Grow better sprouts. Never miss a rinse.{'\n'}Build your sprout crew.
          </Text>
          <Pressable
            className="bg-sprout-600 px-10 py-4 rounded-card mb-4"
            onPress={() => setStep(1)}
          >
            <Text className="text-white font-bold text-lg">Let's Grow</Text>
          </Pressable>
          <Pressable onPress={skipOnboarding}>
            <Text className="text-sprout-400 text-base">Skip setup</Text>
          </Pressable>
        </View>
      )}

      {/* Step 1: Pick first sprout */}
      {step === 1 && (
        <ScrollView className="flex-1" contentContainerClassName="p-6">
          <Text className="text-2xl font-bold text-sprout-800 mb-2">
            What would you like to grow first?
          </Text>
          <View className="bg-sprout-100 rounded-card p-3 mb-4">
            <Text className="text-sm text-sprout-800">
              Not sure? Try <Text className="font-bold">Lentils</Text> — fastest and easiest!
            </Text>
          </View>
          <View className="flex-row flex-wrap justify-between">
            {jarSprouts.map(s => (
              <Pressable
                key={s.id}
                className={`w-[48%] rounded-card p-4 mb-3 border-2 ${
                  selectedBeanId === s.id ? 'bg-white border-sprout-400' : 'bg-white border-transparent'
                }`}
                onPress={() => setSelectedBeanId(s.id)}
              >
                <Text className="text-3xl mb-2">{s.emoji}</Text>
                <Text className="font-bold text-sprout-800">{s.name}</Text>
                <Text className="text-xs text-gray-500">{s.growDays} days · {s.difficulty}</Text>
              </Pressable>
            ))}
          </View>
          <View className="flex-row gap-3 mt-4">
            <Pressable className="flex-1 py-3 rounded-card items-center border border-gray-300" onPress={() => setStep(0)}>
              <Text className="text-gray-600">Back</Text>
            </Pressable>
            <Pressable
              className={`flex-1 py-3 rounded-card items-center ${selectedBeanId ? 'bg-sprout-600' : 'bg-gray-300'}`}
              disabled={!selectedBeanId}
              onPress={() => { rollCharacter(); setStep(2) }}
            >
              <Text className="text-white font-bold">Next</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* Step 2: Character reveal */}
      {step === 2 && character && (
        <ScrollView className="flex-1" contentContainerClassName="items-center p-6">
          <Text className="text-2xl font-bold text-sprout-800 mb-6">Meet your sprout companion!</Text>
          <View className="bg-white rounded-card p-6 items-center w-full border border-sprout-200">
            <CharacterAvatar
              faceColor={character.faceColor}
              eyeColor={character.eyeColor}
              eyeShape={character.eyeShape}
              mouth={character.mouth}
              accessoryEmoji={character.accessoryEmoji}
              size={96}
              animation="reveal"
            />
            <Text className="text-xl font-bold text-sprout-800 mt-4">{character.name}</Text>
            <Text className="text-sm text-sprout-600">{character.personalityLabel}</Text>
            <Text className="text-sm text-gray-500 italic mt-3 text-center">
              "{character.catchphrase}"
            </Text>
          </View>
          <View className="flex-row gap-3 mt-6 w-full">
            <Pressable
              className="flex-1 py-3 rounded-card items-center border border-soak-400"
              onPress={rollCharacter}
            >
              <Text className="text-soak-600 font-medium">Re-roll</Text>
            </Pressable>
            <Pressable
              className="flex-1 py-3 rounded-card items-center bg-sprout-600"
              onPress={() => setStep(3)}
            >
              <Text className="text-white font-bold">Love it</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* Step 3: Notifications */}
      {step === 3 && (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-5xl mb-4">🔔</Text>
          <Text className="text-2xl font-bold text-sprout-800 mb-2 text-center">
            When should we remind you to rinse?
          </Text>
          <Text className="text-gray-500 text-center mb-6">
            Default: 7:00 AM · 3:00 PM · 11:00 PM
          </Text>

          {notifGranted === null ? (
            <Pressable
              className="bg-sprout-600 px-8 py-4 rounded-card mb-4"
              onPress={async () => {
                const granted = await requestNotificationPermission()
                setNotifGranted(granted)
              }}
            >
              <Text className="text-white font-bold text-lg">Allow Notifications</Text>
            </Pressable>
          ) : notifGranted ? (
            <View className="bg-sprout-50 rounded-card p-4 items-center mb-4">
              <Text className="text-2xl mb-2">✅</Text>
              <Text className="text-sprout-600 font-medium">Notifications enabled!</Text>
            </View>
          ) : (
            <View className="bg-soak-50 rounded-card p-4 items-center mb-4">
              <Text className="text-soak-600 text-sm text-center">
                You can enable notifications in Settings anytime.
              </Text>
            </View>
          )}

          <Pressable
            className="bg-sprout-600 px-8 py-3 rounded-card mt-4"
            onPress={() => setStep(4)}
          >
            <Text className="text-white font-bold">{notifGranted !== null ? 'Next' : 'Continue anyway'}</Text>
          </Pressable>
        </View>
      )}

      {/* Step 4: Battery optimization */}
      {step === 4 && (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-5xl mb-4">🔋</Text>
          <Text className="text-2xl font-bold text-sprout-800 mb-3 text-center">
            Keep reminders reliable
          </Text>
          <Text className="text-gray-500 text-center mb-6 leading-6">
            Android may stop SproutPal's reminders to save battery.{'\n\n'}
            Go to Settings → Apps → SproutPal → Battery → Unrestricted{'\n\n'}
            This keeps your rinse reminders working even when the app is closed.
          </Text>
          <Pressable
            className="bg-sprout-600 px-8 py-4 rounded-card mb-4"
            onPress={completeOnboarding}
          >
            <Text className="text-white font-bold text-lg">Start Growing!</Text>
          </Pressable>
          <Pressable onPress={completeOnboarding}>
            <Text className="text-sprout-400">I'll do this later</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}
