import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native'
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
  const [character, setCharacter] = useState<(Omit<CharacterTraits, 'id'> & { personalityLabel: string }) | null>(null)
  const [notifGranted, setNotifGranted] = useState<boolean | null>(null)

  const jarSprouts = SPROUT_TYPES.filter(s => !TRAY_SPROUTS.includes(s.id)).slice(0, 6)
  const selectedBean = jarSprouts.find(s => s.id === selectedBeanId)

  const rollCharacter = useCallback(() => {
    if (!selectedBeanId) return
    setCharacter(generateCharacter(selectedBeanId))
  }, [selectedBeanId])

  const completeOnboarding = async () => {
    setKVStore(KV_KEYS.ONBOARDING_COMPLETE, 'true')
    if (selectedBeanId && character) {
      const bean = SPROUT_TYPES.find(s => s.id === selectedBeanId)!
      const batchId = uuidv4()
      const characterId = uuidv4()
      const now = Date.now()
      await db.insert(characters).values({
        id: characterId, name: character.name, personality: character.personality,
        voiceStyle: character.voiceStyle, waterAttitude: character.waterAttitude,
        harvestAttitude: character.harvestAttitude, secretFear: character.secretFear,
        hiddenTalent: character.hiddenTalent, catchphrase: character.catchphrase,
        rarity: character.rarity, faceColor: character.faceColor, eyeColor: character.eyeColor,
        eyeShape: character.eyeShape, mouth: character.mouth,
        accessoryEmoji: character.accessoryEmoji, accessoryName: character.accessoryName,
        traitsJson: JSON.stringify(character),
      })
      await db.insert(batches).values({
        id: batchId, beanTypeId: bean.id, characterId, jarLabel: 'Jar A', status: 'soaking',
        soakStartAt: now, jarStartAt: now + bean.soakHours * 3600000,
        targetHarvestAt: now + (bean.soakHours / 24 + bean.growDays) * 86400000,
        createdAt: now, updatedAt: now,
      })
    }
    router.replace('/(tabs)')
  }

  // ─── Step 0: Welcome ────────────────────────────────────────
  if (step === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#173404' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 80, marginBottom: 24 }}>{'\ud83c\udf31'}</Text>
          <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#fff', marginBottom: 8 }}>SproutPal</Text>
          <Text style={{ fontSize: 16, color: '#C0DD97', textAlign: 'center', lineHeight: 24, marginBottom: 40 }}>
            Grow better sprouts. Track your yields.{'\n'}Meet your sprout crew.
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setStep(1)}
            style={{ backgroundColor: '#97C459', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 16, marginBottom: 16 }}
          >
            <Text style={{ color: '#173404', fontWeight: 'bold', fontSize: 18 }}>Let's Grow {'\ud83c\udf31'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => { setKVStore(KV_KEYS.ONBOARDING_COMPLETE, 'true'); router.replace('/(tabs)') }}
            style={{ paddingVertical: 12 }}
          >
            <Text style={{ color: '#639922', fontSize: 14 }}>Skip setup</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // ─── Step 1: Pick Sprout ────────────────────────────────────
  if (step === 1) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#173404' }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 }}>Pick your first sprout</Text>
          <Text style={{ fontSize: 14, color: '#C0DD97', marginBottom: 20 }}>Choose what to grow. You can always add more later.</Text>

          {jarSprouts.map(s => (
            <TouchableOpacity
              key={s.id}
              activeOpacity={0.7}
              onPress={() => setSelectedBeanId(s.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                marginBottom: 8,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: selectedBeanId === s.id ? '#97C459' : 'transparent',
                backgroundColor: selectedBeanId === s.id ? '#27500A' : 'rgba(39,80,10,0.4)',
              }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#3B6D11', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                <Text style={{ fontSize: 24 }}>{s.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 'bold', color: '#fff', fontSize: 16 }}>{s.name}</Text>
                <Text style={{ color: '#97C459', fontSize: 12, marginTop: 2 }}>
                  {s.growDays} days {'\u00b7'} {s.difficulty} {'\u00b7'} {s.rinsesPerDay}x rinse/day
                </Text>
              </View>
              {selectedBeanId === s.id && (
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#97C459', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#173404', fontWeight: 'bold', fontSize: 14 }}>{'\u2713'}</Text>
                </View>
              )}
              {s.id === 'lentil' && selectedBeanId !== s.id && (
                <View style={{ backgroundColor: '#97C459', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ color: '#173404', fontSize: 9, fontWeight: 'bold' }}>EASY</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}

          {selectedBean && (
            <View style={{ backgroundColor: 'rgba(39,80,10,0.5)', borderRadius: 16, padding: 16, marginTop: 8 }}>
              <Text style={{ color: '#C0DD97', fontSize: 13, lineHeight: 20 }}>{selectedBean.notes}</Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setStep(0)}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#3B6D11' }}
            >
              <Text style={{ color: '#C0DD97', fontWeight: '500' }}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => { if (selectedBeanId) { rollCharacter(); setStep(2) } }}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: selectedBeanId ? '#97C459' : '#27500A' }}
            >
              <Text style={{ color: selectedBeanId ? '#173404' : '#3B6D11', fontWeight: 'bold' }}>Next</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ─── Step 2: Character Reveal ───────────────────────────────
  if (step === 2 && character) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#173404' }}>
        <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 24, paddingBottom: 40 }}>
          <Text style={{ color: '#639922', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Your sprout companion</Text>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 24, textAlign: 'center' }}>Meet your contestant!</Text>

          <View style={{
            width: '100%', borderRadius: 24, padding: 32, alignItems: 'center',
            borderWidth: 2,
            borderColor: character.rarity === 'legendary' ? '#EF9F27' : character.rarity === 'rare' ? '#85B7EB' : '#3B6D11',
            backgroundColor: 'rgba(39,80,10,0.5)',
          }}>
            <CharacterAvatar
              faceColor={character.faceColor} eyeColor={character.eyeColor}
              eyeShape={character.eyeShape} mouth={character.mouth}
              accessoryEmoji={character.accessoryEmoji} size={100} animation="reveal"
            />
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', marginTop: 20 }}>{character.name}</Text>
            <View style={{
              paddingHorizontal: 16, paddingVertical: 4, borderRadius: 20, marginTop: 8,
              backgroundColor: character.rarity === 'legendary' ? '#EF9F27' : character.rarity === 'rare' ? '#85B7EB' : '#639922',
            }}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', color: '#173404' }}>{character.rarity}</Text>
            </View>
            <Text style={{ color: '#C0DD97', fontSize: 14, marginTop: 8 }}>{character.personalityLabel}</Text>
            <Text style={{ color: '#97C459', fontStyle: 'italic', marginTop: 12, textAlign: 'center', fontSize: 14, lineHeight: 20 }}>
              "{character.catchphrase}"
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={rollCharacter}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#EF9F27' }}
            >
              <Text style={{ color: '#FAC775', fontWeight: '500' }}>{'\ud83c\udfb2'} Re-roll</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setStep(3)}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#97C459' }}
            >
              <Text style={{ color: '#173404', fontWeight: 'bold' }}>Love it {'\u2764\ufe0f'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ─── Step 3: Notifications ──────────────────────────────────
  if (step === 3) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#173404' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>{'\ud83d\udd14'}</Text>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8, textAlign: 'center' }}>Never miss a rinse</Text>
          <Text style={{ color: '#C0DD97', textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
            Your companion will remind you{'\n'}3 times daily: 7 AM, 3 PM, 11 PM
          </Text>

          {notifGranted === null ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={async () => setNotifGranted(await requestNotificationPermission())}
              style={{ backgroundColor: '#97C459', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, marginBottom: 16 }}
            >
              <Text style={{ color: '#173404', fontWeight: 'bold', fontSize: 16 }}>Enable Notifications</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ backgroundColor: 'rgba(39,80,10,0.5)', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 24, marginBottom: 4 }}>{notifGranted ? '\u2705' : '\ud83d\udd15'}</Text>
              <Text style={{ color: '#C0DD97' }}>{notifGranted ? 'Notifications enabled!' : 'You can enable later in Settings'}</Text>
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setStep(4)}
            style={{ backgroundColor: '#97C459', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 }}
          >
            <Text style={{ color: '#173404', fontWeight: 'bold' }}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // ─── Step 4: Ready ──────────────────────────────────────────
  if (step === 4) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#173404' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          {character ? (
            <CharacterAvatar
              faceColor={character.faceColor} eyeColor={character.eyeColor}
              eyeShape={character.eyeShape} mouth={character.mouth}
              accessoryEmoji={character.accessoryEmoji} size={100} animation="celebrate"
            />
          ) : (
            <Text style={{ fontSize: 64, marginBottom: 16 }}>{'\ud83c\udf31'}</Text>
          )}
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff', marginTop: 20, textAlign: 'center' }}>You're ready!</Text>
          <Text style={{ color: '#C0DD97', textAlign: 'center', marginTop: 8, fontSize: 16, lineHeight: 24 }}>
            {character ? `${character.name} is ready for The Great Sprout-Off!` : 'Your farm is ready!'}
          </Text>

          {selectedBean && (
            <View style={{ backgroundColor: 'rgba(39,80,10,0.5)', borderRadius: 16, padding: 16, width: '100%', marginTop: 24 }}>
              <Text style={{ color: '#639922', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Your first batch</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 24, marginRight: 12 }}>{selectedBean.emoji}</Text>
                <View>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>{selectedBean.name}</Text>
                  <Text style={{ color: '#97C459', fontSize: 12 }}>
                    {selectedBean.soakHours}h soak {'\u2192'} {selectedBean.growDays}d grow {'\u2192'} harvest
                  </Text>
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={completeOnboarding}
            style={{ backgroundColor: '#97C459', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 16, marginTop: 32, width: '100%', alignItems: 'center' }}
          >
            <Text style={{ color: '#173404', fontWeight: 'bold', fontSize: 18 }}>Start Growing! {'\ud83c\udf89'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return null
}
