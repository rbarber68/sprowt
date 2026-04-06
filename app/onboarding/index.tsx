import { View, Text, Pressable, ScrollView, Dimensions } from 'react-native'
import { router } from 'expo-router'
import { useState, useCallback } from 'react'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  ZoomIn,
} from 'react-native-reanimated'
import { uuidv4 } from '@/lib/uuid'
import { SPROUT_TYPES, TRAY_SPROUTS } from '@/data/sproutTypes'
import { generateCharacter, type CharacterTraits } from '@/data/characters'
import { CharacterAvatar } from '@/components/CharacterAvatar'
import { setKVStore, KV_KEYS } from '@/lib/kvstore'
import { playSound } from '@/lib/sounds'
import { requestNotificationPermission } from '@/lib/notifications'
import { db } from '@/db/client'
import { batches, characters } from '@/db/schema'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

type OnboardingStep = 0 | 1 | 2 | 3 | 4

export default function OnboardingScreen() {
  const [step, setStep] = useState<OnboardingStep>(0)
  const [selectedBeanId, setSelectedBeanId] = useState<string | null>(null)
  const [character, setCharacter] = useState<Omit<CharacterTraits, 'id'> & { personalityLabel: string } | null>(null)
  const [notifGranted, setNotifGranted] = useState<boolean | null>(null)

  const jarSprouts = SPROUT_TYPES.filter(s => !TRAY_SPROUTS.includes(s.id)).slice(0, 6)
  const selectedBean = jarSprouts.find(s => s.id === selectedBeanId)

  const rollCharacter = useCallback(() => {
    if (!selectedBeanId) return
    playSound('dice-roll')
    setCharacter(generateCharacter(selectedBeanId))
    setTimeout(() => playSound('tada'), 600)
  }, [selectedBeanId])

  const completeOnboarding = async () => {
    setKVStore(KV_KEYS.ONBOARDING_COMPLETE, 'true')

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
    <View className="flex-1 bg-sprout-900">
      {/* Step indicator */}
      {step > 0 && (
        <Animated.View entering={FadeIn.duration(300)} className="flex-row justify-center pt-14 pb-2 gap-2">
          {[1, 2, 3, 4].map(s => (
            <View
              key={s}
              className={`h-1 rounded-full ${
                s <= step ? 'bg-sprout-200 w-8' : 'bg-sprout-800 w-4'
              }`}
            />
          ))}
        </Animated.View>
      )}

      {/* Step 0: Welcome */}
      {step === 0 && (
        <View className="flex-1">
          {/* Top decorative area */}
          <View className="flex-1 items-center justify-center">
            {/* Floating sprout emojis background */}
            <Animated.Text
              entering={FadeIn.delay(200).duration(800)}
              className="absolute top-20 left-8 text-4xl opacity-20"
            >{'\ud83e\udd66'}</Animated.Text>
            <Animated.Text
              entering={FadeIn.delay(400).duration(800)}
              className="absolute top-32 right-12 text-3xl opacity-15"
            >{'\ud83c\udf3f'}</Animated.Text>
            <Animated.Text
              entering={FadeIn.delay(600).duration(800)}
              className="absolute top-56 left-16 text-2xl opacity-10"
            >{'\ud83c\udf31'}</Animated.Text>
            <Animated.Text
              entering={FadeIn.delay(300).duration(800)}
              className="absolute bottom-40 right-8 text-3xl opacity-15"
            >{'\ud83c\udf3e'}</Animated.Text>
            <Animated.Text
              entering={FadeIn.delay(500).duration(800)}
              className="absolute bottom-60 left-6 text-2xl opacity-10"
            >{'\ud83e\udeb4'}</Animated.Text>

            {/* Main hero */}
            <Animated.View entering={ZoomIn.delay(100).duration(600).springify()}>
              <View className="w-32 h-32 rounded-full bg-sprout-600 items-center justify-center mb-8" style={{ shadowColor: '#3B6D11', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 12 }}>
                <Text className="text-7xl">{'\ud83c\udf31'}</Text>
              </View>
            </Animated.View>

            <Animated.Text entering={FadeInDown.delay(300).duration(500)} className="text-4xl font-bold text-white mb-3">
              SproutPal
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(450).duration(500)} className="text-base text-sprout-200 text-center leading-6 px-8">
              Grow better sprouts. Track your yields.{'\n'}Meet your sprout crew.
            </Animated.Text>
          </View>

          {/* Bottom action area */}
          <Animated.View entering={FadeInUp.delay(600).duration(500)} className="px-8 pb-12">
            <Pressable
              className="bg-sprout-200 py-4 rounded-2xl items-center mb-4"
              style={{ shadowColor: '#97C459', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }}
              onPress={() => setStep(1)}
            >
              <Text className="text-sprout-900 font-bold text-lg">Let's Grow {'\ud83c\udf31'}</Text>
            </Pressable>
            <Pressable className="py-3 items-center" onPress={skipOnboarding}>
              <Text className="text-sprout-400 text-sm">I know what I'm doing — skip setup</Text>
            </Pressable>
          </Animated.View>
        </View>
      )}

      {/* Step 1: Pick first sprout */}
      {step === 1 && (
        <View className="flex-1">
          <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
            <Animated.View entering={FadeInDown.duration(400)} className="px-6 pt-4 pb-2">
              <Text className="text-2xl font-bold text-white mb-1">Pick your first sprout</Text>
              <Text className="text-sprout-200 text-sm mb-4">Choose what you want to grow. You can always add more later.</Text>
            </Animated.View>

            {/* Recommendation */}
            <Animated.View entering={FadeInDown.delay(150).duration(400)} className="mx-6 mb-4">
              <Pressable
                className={`rounded-2xl p-4 border-2 flex-row items-center ${
                  selectedBeanId === 'lentil' ? 'bg-sprout-800 border-sprout-400' : 'bg-sprout-800/50 border-sprout-800'
                }`}
                onPress={() => setSelectedBeanId('lentil')}
              >
                <View className="w-14 h-14 rounded-xl bg-sprout-600 items-center justify-center mr-4">
                  <Text className="text-3xl">{'\ud83e\udeb8'}</Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-white font-bold text-base">Lentils</Text>
                    <View className="bg-sprout-400 px-2 py-0.5 rounded-full">
                      <Text className="text-sprout-900 text-[10px] font-bold">RECOMMENDED</Text>
                    </View>
                  </View>
                  <Text className="text-sprout-200 text-xs mt-1">Ready in 3 days · Easiest to grow · Great first batch</Text>
                </View>
                {selectedBeanId === 'lentil' && <Text className="text-sprout-200 text-xl">{'\u2713'}</Text>}
              </Pressable>
            </Animated.View>

            {/* Grid */}
            <View className="px-6">
              <Text className="text-sprout-400 text-xs font-medium uppercase tracking-wider mb-3">Or choose another</Text>
              {jarSprouts.filter(s => s.id !== 'lentil').map((s, i) => (
                <Animated.View key={s.id} entering={FadeInDown.delay(200 + i * 60).duration(400)} className="mb-2">
                  <Pressable
                    className={`rounded-2xl p-4 border-2 flex-row items-center ${
                      selectedBeanId === s.id
                        ? 'bg-sprout-800 border-sprout-400'
                        : 'bg-sprout-800/50 border-transparent'
                    }`}
                    onPress={() => setSelectedBeanId(s.id)}
                  >
                    <View className="w-12 h-12 rounded-xl bg-sprout-700 items-center justify-center mr-4">
                      <Text className="text-2xl">{s.emoji}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-white text-base">{s.name}</Text>
                      <Text className="text-sprout-400 text-xs mt-0.5">{s.growDays} days {'\u00b7'} {s.difficulty} {'\u00b7'} {s.rinsesPerDay}x rinse</Text>
                    </View>
                    {selectedBeanId === s.id && (
                      <View className="w-7 h-7 rounded-full bg-sprout-400 items-center justify-center">
                        <Text className="text-sprout-900 text-sm font-bold">{'\u2713'}</Text>
                      </View>
                    )}
                  </Pressable>
                </Animated.View>
              ))}
            </View>

            {/* Selected info */}
            {selectedBean && (
              <Animated.View entering={FadeIn.duration(300)} className="mx-6 mt-2 bg-sprout-800/50 rounded-2xl p-4">
                <Text className="text-sprout-200 text-sm leading-5">{selectedBean.notes}</Text>
              </Animated.View>
            )}
          </ScrollView>

          {/* Fixed bottom nav */}
          <View className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-sprout-900">
            <View className="flex-row gap-3">
              <Pressable className="flex-1 py-3.5 rounded-xl items-center border border-sprout-600" onPress={() => setStep(0)}>
                <Text className="text-sprout-200 font-medium">Back</Text>
              </Pressable>
              <Pressable
                className={`flex-1 py-3.5 rounded-xl items-center ${selectedBeanId ? 'bg-sprout-200' : 'bg-sprout-800'}`}
                disabled={!selectedBeanId}
                onPress={() => { rollCharacter(); setStep(2) }}
              >
                <Text className={selectedBeanId ? 'text-sprout-900 font-bold' : 'text-sprout-600'}>Next</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Step 2: Character reveal */}
      {step === 2 && character && (
        <View className="flex-1 items-center justify-center px-6">
          <Animated.Text entering={FadeInDown.duration(400)} className="text-sm text-sprout-400 uppercase tracking-widest mb-2">
            Your sprout companion
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(100).duration(400)} className="text-2xl font-bold text-white mb-8 text-center">
            Meet your contestant!
          </Animated.Text>

          {/* Character card */}
          <Animated.View
            entering={ZoomIn.delay(300).duration(600).springify()}
            className={`w-full rounded-3xl p-8 items-center border-2 ${
              character.rarity === 'legendary' ? 'bg-soak-800/30 border-soak-200' :
              character.rarity === 'rare' ? 'bg-info-800/30 border-info-200' :
              'bg-sprout-800/50 border-sprout-600'
            }`}
          >
            <CharacterAvatar
              faceColor={character.faceColor}
              eyeColor={character.eyeColor}
              eyeShape={character.eyeShape}
              mouth={character.mouth}
              accessoryEmoji={character.accessoryEmoji}
              size={100}
              animation="reveal"
            />
            <Text className="text-2xl font-bold text-white mt-5">{character.name}</Text>

            {/* Rarity badge */}
            <View className={`px-4 py-1 rounded-full mt-2 ${
              character.rarity === 'legendary' ? 'bg-soak-200' :
              character.rarity === 'rare' ? 'bg-info-200' :
              character.rarity === 'uncommon' ? 'bg-sprout-200' :
              'bg-sprout-600'
            }`}>
              <Text className={`text-xs font-bold uppercase ${
                character.rarity === 'common' ? 'text-white' : 'text-sprout-900'
              }`}>{character.rarity}</Text>
            </View>

            <Text className="text-sprout-200 text-sm mt-2">{character.personalityLabel}</Text>
            <Text className="text-sprout-400 italic mt-3 text-center text-sm leading-5">
              "{character.catchphrase}"
            </Text>

            {/* Quick traits */}
            <View className="flex-row gap-2 mt-4 flex-wrap justify-center">
              <View className="bg-sprout-800 px-3 py-1 rounded-full">
                <Text className="text-sprout-200 text-xs">{character.voiceStyle}</Text>
              </View>
              <View className="bg-sprout-800 px-3 py-1 rounded-full">
                <Text className="text-sprout-200 text-xs">Fears: {character.secretFear}</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(600).duration(400)} className="flex-row gap-3 mt-8 w-full">
            <Pressable
              className="flex-1 py-3.5 rounded-xl items-center border border-soak-400"
              onPress={rollCharacter}
            >
              <Text className="text-soak-200 font-medium">{'\ud83c\udfb2'} Re-roll</Text>
            </Pressable>
            <Pressable
              className="flex-1 py-3.5 rounded-xl items-center bg-sprout-200"
              onPress={() => setStep(3)}
            >
              <Text className="text-sprout-900 font-bold">Love it {'\u2764\ufe0f'}</Text>
            </Pressable>
          </Animated.View>
        </View>
      )}

      {/* Step 3: Notifications */}
      {step === 3 && (
        <View className="flex-1 items-center justify-center px-8">
          <Animated.View entering={ZoomIn.duration(400)} className="w-24 h-24 rounded-full bg-sprout-800 items-center justify-center mb-6">
            <Text className="text-5xl">{'\ud83d\udd14'}</Text>
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(200).duration(400)} className="text-2xl font-bold text-white mb-2 text-center">
            Never miss a rinse
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(300).duration(400)} className="text-sprout-200 text-center mb-8 leading-6">
            Your sprout companion will remind you{'\n'}3 times a day to rinse your batch.
          </Animated.Text>

          {/* Rinse time preview */}
          <Animated.View entering={FadeIn.delay(400).duration(400)} className="w-full bg-sprout-800/50 rounded-2xl p-5 mb-8">
            <Text className="text-sprout-400 text-xs uppercase tracking-wider mb-3">Default schedule</Text>
            {[
              { time: '7:00 AM', label: 'Morning rinse', emoji: '\u2600\ufe0f' },
              { time: '3:00 PM', label: 'Afternoon rinse', emoji: '\ud83c\udf24\ufe0f' },
              { time: '11:00 PM', label: 'Night rinse', emoji: '\ud83c\udf19' },
            ].map((r, i) => (
              <View key={i} className="flex-row items-center py-2.5 border-b border-sprout-800 last:border-0">
                <Text className="text-lg mr-3">{r.emoji}</Text>
                <Text className="text-white font-medium flex-1">{r.time}</Text>
                <Text className="text-sprout-400 text-xs">{r.label}</Text>
              </View>
            ))}
          </Animated.View>

          {notifGranted === null ? (
            <Animated.View entering={FadeInUp.delay(500).duration(400)} className="w-full">
              <Pressable
                className="bg-sprout-200 py-4 rounded-xl items-center"
                style={{ shadowColor: '#97C459', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }}
                onPress={async () => {
                  const granted = await requestNotificationPermission()
                  setNotifGranted(granted)
                }}
              >
                <Text className="text-sprout-900 font-bold text-base">Enable Notifications</Text>
              </Pressable>
              <Pressable className="py-3 items-center" onPress={() => setStep(4)}>
                <Text className="text-sprout-400 text-sm">Skip for now</Text>
              </Pressable>
            </Animated.View>
          ) : notifGranted ? (
            <Animated.View entering={ZoomIn.duration(300)} className="w-full items-center">
              <View className="bg-sprout-600/30 rounded-2xl p-4 items-center mb-4 w-full">
                <Text className="text-3xl mb-1">{'\u2705'}</Text>
                <Text className="text-sprout-200 font-medium">You're all set!</Text>
              </View>
              <Pressable className="bg-sprout-200 py-4 rounded-xl items-center w-full" onPress={() => setStep(4)}>
                <Text className="text-sprout-900 font-bold">Continue</Text>
              </Pressable>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.duration(300)} className="w-full items-center">
              <View className="bg-soak-800/30 rounded-2xl p-4 items-center mb-4 w-full">
                <Text className="text-soak-200 text-sm text-center">No worries! Enable in Settings anytime.</Text>
              </View>
              <Pressable className="bg-sprout-200 py-4 rounded-xl items-center w-full" onPress={() => setStep(4)}>
                <Text className="text-sprout-900 font-bold">Continue</Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      )}

      {/* Step 4: Ready to go */}
      {step === 4 && (
        <View className="flex-1 items-center justify-center px-8">
          <Animated.View entering={ZoomIn.duration(500).springify()} className="mb-8">
            {character ? (
              <CharacterAvatar
                faceColor={character.faceColor}
                eyeColor={character.eyeColor}
                eyeShape={character.eyeShape}
                mouth={character.mouth}
                accessoryEmoji={character.accessoryEmoji}
                size={100}
                animation="celebrate"
              />
            ) : (
              <View className="w-24 h-24 rounded-full bg-sprout-600 items-center justify-center">
                <Text className="text-5xl">{'\ud83c\udf31'}</Text>
              </View>
            )}
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(300).duration(400)} className="text-3xl font-bold text-white mb-2 text-center">
            You're ready!
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(450).duration(400)} className="text-sprout-200 text-center mb-2 text-base leading-6">
            {character
              ? `${character.name} is ready to start The Great Sprout-Off!`
              : 'Your sprout farm is ready to go!'
            }
          </Animated.Text>
          {selectedBean && (
            <Animated.View entering={FadeIn.delay(600).duration(400)} className="bg-sprout-800/50 rounded-2xl p-4 w-full mt-4 mb-8">
              <Text className="text-sprout-400 text-xs uppercase tracking-wider mb-2">Your first batch</Text>
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">{selectedBean.emoji}</Text>
                <View>
                  <Text className="text-white font-bold">{selectedBean.name}</Text>
                  <Text className="text-sprout-400 text-xs">
                    {selectedBean.soakHours}h soak {'\u2192'} {selectedBean.growDays}d grow {'\u2192'} harvest
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}

          <Animated.View entering={FadeInUp.delay(700).duration(400)} className="w-full">
            <Pressable
              className="bg-sprout-200 py-4 rounded-xl items-center"
              style={{ shadowColor: '#97C459', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }}
              onPress={completeOnboarding}
            >
              <Text className="text-sprout-900 font-bold text-lg">Start Growing! {'\ud83c\udf89'}</Text>
            </Pressable>
          </Animated.View>
        </View>
      )}
    </View>
  )
}
