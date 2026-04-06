import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { uuidv4 } from '@/lib/uuid'
import { SPROUT_TYPES, TRAY_SPROUTS, BEGINNER_PROGRESSION, type BeanType } from '@/data/sproutTypes'
import { generateCharacter, type CharacterTraits } from '@/data/characters'
import { CharacterAvatar } from '@/components/CharacterAvatar'
import { db } from '@/db/client'
import { batches, characters, seedSources } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getKVStore, KV_KEYS } from '@/lib/kvstore'
import { requestNotificationPermission, scheduleRinseNotifications } from '@/lib/notifications'
import { ContainerPicker } from '@/components/ContainerPicker'
import { getYieldHint } from '@/lib/performance'

type Step = 0 | 1 | 2 | 3 | 4

export default function NewBatchScreen() {
  const params = useLocalSearchParams<{ beanTypeId?: string }>()
  const [step, setStep] = useState<Step>(0)
  const [selectedBeanTypeId, setSelectedBeanTypeId] = useState<string | null>(params.beanTypeId ?? null)
  const [seedSourceId, setSeedSourceId] = useState<string | null>(null)
  const [newSupplier, setNewSupplier] = useState('')
  const [jarLabel, setJarLabel] = useState('Jar A')
  const [startNow, setStartNow] = useState(true)
  const [character, setCharacter] = useState<(Omit<CharacterTraits, 'id'> & { personalityLabel: string }) | null>(null)
  const [saving, setSaving] = useState(false)
  const [containerId, setContainerId] = useState<string | null>(null)
  const [seedAmount, setSeedAmount] = useState('')
  const [yieldHint, setYieldHint] = useState<string | null>(null)

  const selectedBean = SPROUT_TYPES.find(s => s.id === selectedBeanTypeId)

  // Existing seed sources for selected bean type
  const [existingSources, setExistingSources] = useState<{ id: string; supplierName: string }[]>([])
  useEffect(() => {
    if (!selectedBeanTypeId) return
    db.select({ id: seedSources.id, supplierName: seedSources.supplierName })
      .from(seedSources)
      .where(eq(seedSources.beanTypeId, selectedBeanTypeId))
      .then(setExistingSources)
  }, [selectedBeanTypeId])

  const rollCharacter = useCallback(() => {
    if (!selectedBeanTypeId) return
    setCharacter(generateCharacter(selectedBeanTypeId))
  }, [selectedBeanTypeId])

  // Auto-roll character on step 3
  useEffect(() => {
    if (step === 3 && !character) rollCharacter()
  }, [step, character, rollCharacter])

  // Auto-fill seed amount from bean type default
  useEffect(() => {
    if (selectedBean) {
      setSeedAmount(String(selectedBean.seedAmountGrams))
    }
  }, [selectedBean])

  // Fetch yield hint when container+bean combo changes
  useEffect(() => {
    if (selectedBeanTypeId && containerId) {
      getYieldHint(selectedBeanTypeId, containerId).then(setYieldHint)
    } else {
      setYieldHint(null)
    }
  }, [selectedBeanTypeId, containerId])

  const createBatch = async () => {
    if (!selectedBean || !character) return
    setSaving(true)

    try {
      const batchId = uuidv4()
      const characterId = uuidv4()
      const now = Date.now()
      const soakMs = selectedBean.soakHours * 3600000
      const growMs = selectedBean.growDays * 86400000

      // Create seed source if new supplier entered
      let finalSeedSourceId = seedSourceId
      if (!finalSeedSourceId && newSupplier.trim()) {
        const srcId = uuidv4()
        await db.insert(seedSources).values({
          id: srcId,
          beanTypeId: selectedBean.id,
          supplierName: newSupplier.trim(),
          stockGrams: 0,
          createdAt: now,
        })
        finalSeedSourceId = srcId
      }

      // Deduct seed stock if tracking a source
      if (finalSeedSourceId) {
        const [source] = await db.select().from(seedSources)
          .where(eq(seedSources.id, finalSeedSourceId))
        if (source && source.stockGrams && source.stockGrams > 0) {
          const deduction = selectedBean.seedAmountGrams
          await db.update(seedSources)
            .set({ stockGrams: Math.max(0, source.stockGrams - deduction) })
            .where(eq(seedSources.id, finalSeedSourceId))
        }
      }

      // Save character
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

      // Create batch
      await db.insert(batches).values({
        id: batchId,
        beanTypeId: selectedBean.id,
        seedSourceId: finalSeedSourceId,
        characterId,
        jarLabel,
        status: 'soaking',
        soakStartAt: now,
        jarStartAt: now + soakMs,
        targetHarvestAt: now + soakMs + growMs,
        createdAt: now,
        updatedAt: now,
        containerId: containerId,
        seedAmountGrams: parseFloat(seedAmount) || selectedBean.seedAmountGrams,
      })

      // Schedule notifications
      const hasPermission = await requestNotificationPermission()
      if (hasPermission) {
        const rinseTimes = [
          getKVStore(KV_KEYS.RINSE_TIME_1) ?? '07:00',
          getKVStore(KV_KEYS.RINSE_TIME_2) ?? '15:00',
          getKVStore(KV_KEYS.RINSE_TIME_3) ?? '23:00',
        ]
        const ids = await scheduleRinseNotifications(
          batchId,
          `${character.accessoryEmoji} ${character.name} needs a rinse!`,
          character.catchphrase,
          rinseTimes,
        )
        // Store notification IDs on batch
        await db.update(batches)
          .set({ notificationIds: JSON.stringify(ids), updatedAt: Date.now() })
          .where(eq(batches.id, batchId))
      }

      router.replace('/(tabs)')
    } catch (e) {
      console.error('Failed to create batch:', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <View className="flex-1 bg-white">
      {/* Progress dots */}
      <View className="flex-row justify-center py-4 gap-2">
        {([0, 1, 2, 3, 4] as Step[]).map(s => (
          <View
            key={s}
            className={`w-2.5 h-2.5 rounded-full ${s === step ? 'bg-sprout-600' : s < step ? 'bg-sprout-200' : 'bg-gray-200'}`}
          />
        ))}
      </View>

      {step === 0 && (
        <Step1PickSprout
          selectedId={selectedBeanTypeId}
          onSelect={(id) => { setSelectedBeanTypeId(id); setCharacter(null) }}
          onNext={() => setStep(1)}
        />
      )}
      {step === 1 && (
        <Step2SeedSource
          existingSources={existingSources}
          selectedSourceId={seedSourceId}
          onSelectSource={setSeedSourceId}
          newSupplier={newSupplier}
          onNewSupplier={setNewSupplier}
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && selectedBean && (
        <Step3JarTiming
          bean={selectedBean}
          jarLabel={jarLabel}
          onJarLabel={setJarLabel}
          startNow={startNow}
          onStartNow={setStartNow}
          containerId={containerId}
          onContainerId={setContainerId}
          seedAmount={seedAmount}
          onSeedAmount={setSeedAmount}
          yieldHint={yieldHint}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && character && (
        <Step4CharacterReveal
          character={character}
          onReroll={rollCharacter}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && selectedBean && character && (
        <Step5Confirm
          bean={selectedBean}
          character={character}
          jarLabel={jarLabel}
          saving={saving}
          onConfirm={createBatch}
          onBack={() => setStep(3)}
        />
      )}
    </View>
  )
}

// ─── Step 1: Pick Sprout Type ─────────────────────────────────────────────────

function Step1PickSprout({
  selectedId,
  onSelect,
  onNext,
}: {
  selectedId: string | null
  onSelect: (id: string) => void
  onNext: () => void
}) {
  const jarSprouts = SPROUT_TYPES.filter(s => !TRAY_SPROUTS.includes(s.id))
  const traySprouts = SPROUT_TYPES.filter(s => TRAY_SPROUTS.includes(s.id))

  return (
    <ScrollView className="flex-1 px-4">
      <Text className="text-2xl font-bold text-sprout-800 mb-2">Pick your sprout</Text>

      {/* Beginner recommendation */}
      <View className="bg-sprout-50 rounded-card p-3 mb-4">
        <Text className="text-sm text-sprout-600">
          Not sure? Try <Text className="font-bold">Lentils</Text> — fastest and easiest!
        </Text>
      </View>

      {/* Jar sprouts */}
      <Text className="text-sm font-medium text-gray-500 mb-2">Jar Sprouts</Text>
      <View className="flex-row flex-wrap justify-between mb-4">
        {jarSprouts.map(s => (
          <Pressable
            key={s.id}
            className={`w-[31%] rounded-card p-3 mb-2 border ${
              selectedId === s.id ? 'bg-sprout-50 border-sprout-400' : 'bg-white border-gray-200'
            }`}
            onPress={() => onSelect(s.id)}
          >
            <Text className="text-2xl mb-1">{s.emoji}</Text>
            <Text className="text-xs font-medium text-sprout-800">{s.name}</Text>
            <Text className="text-[10px] text-gray-400">{s.growDays}d · {s.difficulty}</Text>
          </Pressable>
        ))}
      </View>

      {/* Tray sprouts */}
      <Text className="text-sm font-medium text-gray-500 mb-2">Tray Sprouts (need soil)</Text>
      <View className="flex-row flex-wrap justify-between mb-4">
        {traySprouts.map(s => (
          <Pressable
            key={s.id}
            className={`w-[31%] rounded-card p-3 mb-2 border ${
              selectedId === s.id ? 'bg-soak-50 border-soak-400' : 'bg-white border-gray-200'
            }`}
            onPress={() => onSelect(s.id)}
          >
            <Text className="text-2xl mb-1">{s.emoji}</Text>
            <Text className="text-xs font-medium text-sprout-800">{s.name}</Text>
            <Text className="text-[10px] text-gray-400">{s.growDays}d · {s.difficulty}</Text>
          </Pressable>
        ))}
      </View>

      {/* Selected summary */}
      {selectedId && (
        <View className="bg-gray-50 rounded-card p-3 mb-4">
          <Text className="text-sm text-gray-600">
            {SPROUT_TYPES.find(s => s.id === selectedId)?.notes}
          </Text>
        </View>
      )}

      <Pressable
        className={`py-4 rounded-card items-center mb-8 ${selectedId ? 'bg-sprout-600' : 'bg-gray-300'}`}
        onPress={onNext}
        disabled={!selectedId}
      >
        <Text className="text-white font-bold text-lg">Next</Text>
      </Pressable>
    </ScrollView>
  )
}

// ─── Step 2: Seed Source ──────────────────────────────────────────────────────

function Step2SeedSource({
  existingSources,
  selectedSourceId,
  onSelectSource,
  newSupplier,
  onNewSupplier,
  onNext,
  onBack,
}: {
  existingSources: { id: string; supplierName: string }[]
  selectedSourceId: string | null
  onSelectSource: (id: string | null) => void
  newSupplier: string
  onNewSupplier: (s: string) => void
  onNext: () => void
  onBack: () => void
}) {
  return (
    <ScrollView className="flex-1 px-4">
      <Text className="text-2xl font-bold text-sprout-800 mb-2">Seed source</Text>
      <Text className="text-gray-500 mb-4">Optional: track where your seeds came from</Text>

      {existingSources.length > 0 && (
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-500 mb-2">Previous sources</Text>
          {existingSources.map(src => (
            <Pressable
              key={src.id}
              className={`p-3 rounded-card border mb-2 ${
                selectedSourceId === src.id ? 'bg-sprout-50 border-sprout-400' : 'border-gray-200'
              }`}
              onPress={() => {
                onSelectSource(selectedSourceId === src.id ? null : src.id)
                onNewSupplier('')
              }}
            >
              <Text className="font-medium text-sprout-800">{src.supplierName}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Text className="text-sm font-medium text-gray-500 mb-2">Or add a new source</Text>
      <TextInput
        className="bg-gray-100 rounded-card px-4 py-3 text-base mb-4"
        placeholder="Supplier name (e.g., Mumm's)"
        value={newSupplier}
        onChangeText={(text) => {
          onNewSupplier(text)
          onSelectSource(null)
        }}
        placeholderTextColor="#999"
      />

      <View className="flex-row gap-3 mb-8">
        <Pressable className="flex-1 py-3 rounded-card items-center border border-gray-300" onPress={onBack}>
          <Text className="text-gray-600 font-medium">Back</Text>
        </Pressable>
        <Pressable className="flex-1 py-3 rounded-card items-center bg-sprout-600" onPress={onNext}>
          <Text className="text-white font-bold">Next</Text>
        </Pressable>
      </View>

      <Pressable className="items-center mb-8" onPress={onNext}>
        <Text className="text-sprout-400 text-sm">Skip seed tracking</Text>
      </Pressable>
    </ScrollView>
  )
}

// ─── Step 3: Jar Label and Timing ─────────────────────────────────────────────

function Step3JarTiming({
  bean,
  jarLabel,
  onJarLabel,
  startNow,
  onStartNow,
  containerId,
  onContainerId,
  seedAmount,
  onSeedAmount,
  yieldHint,
  onNext,
  onBack,
}: {
  bean: BeanType
  jarLabel: string
  onJarLabel: (s: string) => void
  startNow: boolean
  onStartNow: (b: boolean) => void
  containerId: string | null
  onContainerId: (id: string | null) => void
  seedAmount: string
  onSeedAmount: (s: string) => void
  yieldHint: string | null
  onNext: () => void
  onBack: () => void
}) {
  const now = new Date()
  const harvestDate = new Date(now.getTime() + (bean.soakHours / 24 + bean.growDays) * 86400000)

  return (
    <ScrollView className="flex-1 px-4">
      <Text className="text-2xl font-bold text-sprout-800 mb-4">Jar & Timing</Text>

      <Text className="text-sm font-medium text-gray-500 mb-2">Seed amount (grams)</Text>
      <View className="flex-row items-center gap-2 mb-4">
        <TextInput
          className="bg-gray-100 rounded-card px-4 py-3 text-base flex-1"
          value={seedAmount}
          onChangeText={onSeedAmount}
          keyboardType="numeric"
          placeholder="20"
          placeholderTextColor="#999"
        />
        <Text className="text-sm text-gray-400">grams</Text>
      </View>

      <ContainerPicker
        selectedId={containerId}
        onSelect={onContainerId}
        yieldHint={yieldHint}
      />

      <View className="h-3" />

      <Text className="text-sm font-medium text-gray-500 mb-2">Jar label</Text>
      <TextInput
        className="bg-gray-100 rounded-card px-4 py-3 text-base mb-4"
        value={jarLabel}
        onChangeText={onJarLabel}
        placeholder="Jar A"
        placeholderTextColor="#999"
      />

      <Text className="text-sm font-medium text-gray-500 mb-2">When to start?</Text>
      <View className="flex-row gap-2 mb-4">
        <Pressable
          className={`flex-1 py-3 rounded-card border items-center ${startNow ? 'bg-sprout-50 border-sprout-400' : 'border-gray-200'}`}
          onPress={() => onStartNow(true)}
        >
          <Text className={startNow ? 'font-bold text-sprout-800' : 'text-gray-600'}>Start now</Text>
        </Pressable>
        <Pressable
          className={`flex-1 py-3 rounded-card border items-center ${!startNow ? 'bg-sprout-50 border-sprout-400' : 'border-gray-200'}`}
          onPress={() => onStartNow(false)}
        >
          <Text className={!startNow ? 'font-bold text-sprout-800' : 'text-gray-600'}>Plan for date</Text>
        </Pressable>
      </View>

      {/* Timeline summary */}
      <View className="bg-gray-50 rounded-card p-4 mb-4">
        <Text className="text-sm font-medium text-sprout-800 mb-2">Timeline</Text>
        <View className="flex-row justify-between mb-1">
          <Text className="text-sm text-gray-500">Soak</Text>
          <Text className="text-sm text-sprout-600">{bean.soakHours}h starting today</Text>
        </View>
        <View className="flex-row justify-between mb-1">
          <Text className="text-sm text-gray-500">Grow</Text>
          <Text className="text-sm text-sprout-600">{bean.growDays} days</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-sm text-gray-500">Harvest</Text>
          <Text className="text-sm font-medium text-sprout-800">
            {harvestDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-3 mb-8">
        <Pressable className="flex-1 py-3 rounded-card items-center border border-gray-300" onPress={onBack}>
          <Text className="text-gray-600 font-medium">Back</Text>
        </Pressable>
        <Pressable className="flex-1 py-3 rounded-card items-center bg-sprout-600" onPress={onNext}>
          <Text className="text-white font-bold">Next</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

// ─── Step 4: Character Reveal ─────────────────────────────────────────────────

function Step4CharacterReveal({
  character,
  onReroll,
  onNext,
  onBack,
}: {
  character: Omit<CharacterTraits, 'id'> & { personalityLabel: string }
  onReroll: () => void
  onNext: () => void
  onBack: () => void
}) {
  return (
    <ScrollView className="flex-1 px-4 items-center">
      <Text className="text-2xl font-bold text-sprout-800 mb-6 text-center">
        Meet your sprout companion!
      </Text>

      {/* Character card */}
      <View className={`w-full rounded-card p-6 items-center mb-6 border-2 ${
        character.rarity === 'legendary' ? 'border-soak-200 bg-soak-50' :
        character.rarity === 'rare' ? 'border-info-200 bg-info-50' :
        'border-sprout-200 bg-sprout-50'
      }`}>
        <CharacterAvatar
          faceColor={character.faceColor}
          eyeColor={character.eyeColor}
          eyeShape={character.eyeShape}
          mouth={character.mouth}
          accessoryEmoji={character.accessoryEmoji}
          size={88}
          animation="reveal"
        />
        <Text className="text-xl font-bold text-sprout-800 mt-4">{character.name}</Text>

        {/* Rarity badge */}
        <View className={`px-3 py-1 rounded-chip mt-2 ${
          character.rarity === 'legendary' ? 'bg-soak-200' :
          character.rarity === 'rare' ? 'bg-info-200' :
          character.rarity === 'uncommon' ? 'bg-sprout-200' :
          'bg-gray-200'
        }`}>
          <Text className="text-xs font-bold uppercase">{character.rarity}</Text>
        </View>

        <Text className="text-sm text-sprout-600 mt-2">{character.personalityLabel}</Text>
        <Text className="text-sm text-gray-500 italic mt-3 text-center">
          "{character.catchphrase}"
        </Text>

        {/* Traits */}
        <View className="w-full mt-4 pt-4 border-t border-gray-200">
          <TraitRow label="Voice" value={character.voiceStyle} />
          <TraitRow label="Secret fear" value={character.secretFear} />
          <TraitRow label="Hidden talent" value={character.hiddenTalent} />
          <TraitRow label="Water attitude" value={character.waterAttitude} />
        </View>
      </View>

      <View className="flex-row gap-3 w-full mb-4">
        <Pressable className="flex-1 py-3 rounded-card items-center border border-gray-300" onPress={onBack}>
          <Text className="text-gray-600 font-medium">Back</Text>
        </Pressable>
        <Pressable className="flex-1 py-3 rounded-card items-center border border-soak-400" onPress={onReroll}>
          <Text className="text-soak-600 font-medium">Re-roll</Text>
        </Pressable>
      </View>

      <Pressable className="w-full py-4 rounded-card items-center bg-sprout-600 mb-8" onPress={onNext}>
        <Text className="text-white font-bold text-lg">Keep this one</Text>
      </Pressable>
    </ScrollView>
  )
}

function TraitRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="text-xs text-gray-400">{label}</Text>
      <Text className="text-xs text-gray-600 flex-1 text-right">{value}</Text>
    </View>
  )
}

// ─── Step 5: Confirm & Schedule ───────────────────────────────────────────────

function Step5Confirm({
  bean,
  character,
  jarLabel,
  saving,
  onConfirm,
  onBack,
}: {
  bean: BeanType
  character: Omit<CharacterTraits, 'id'> & { personalityLabel: string }
  jarLabel: string
  saving: boolean
  onConfirm: () => void
  onBack: () => void
}) {
  const now = new Date()
  const harvestDate = new Date(now.getTime() + (bean.soakHours / 24 + bean.growDays) * 86400000)

  return (
    <ScrollView className="flex-1 px-4">
      <Text className="text-2xl font-bold text-sprout-800 mb-4">Confirm your batch</Text>

      <View className="bg-gray-50 rounded-card p-4 mb-4">
        <View className="flex-row items-center mb-3">
          <Text className="text-3xl mr-3">{bean.emoji}</Text>
          <View>
            <Text className="font-bold text-sprout-800">{bean.name}</Text>
            <Text className="text-sm text-gray-500">{jarLabel}</Text>
          </View>
        </View>
        <View className="flex-row items-center mb-3">
          <CharacterAvatar
            faceColor={character.faceColor}
            eyeColor={character.eyeColor}
            eyeShape={character.eyeShape}
            mouth={character.mouth}
            accessoryEmoji={character.accessoryEmoji}
            size={32}
          />
          <Text className="ml-2 text-sm text-gray-600">{character.name} ({character.personalityLabel})</Text>
        </View>
        <View className="border-t border-gray-200 pt-2">
          <View className="flex-row justify-between mb-1">
            <Text className="text-sm text-gray-500">Start soak</Text>
            <Text className="text-sm text-sprout-800">Now</Text>
          </View>
          <View className="flex-row justify-between mb-1">
            <Text className="text-sm text-gray-500">Drain to jar</Text>
            <Text className="text-sm text-sprout-800">In {bean.soakHours}h</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-500">Target harvest</Text>
            <Text className="text-sm font-medium text-sprout-800">
              {harvestDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          </View>
        </View>
      </View>

      {/* Rinse schedule */}
      <View className="bg-info-50 border border-info-200 rounded-card p-4 mb-6">
        <Text className="text-sm font-medium text-info-600 mb-2">Rinse reminders</Text>
        <Text className="text-sm text-gray-600">7:00 AM · 3:00 PM · 11:00 PM</Text>
        <Text className="text-xs text-gray-400 mt-1">Change default times in Settings</Text>
      </View>

      <View className="flex-row gap-3 mb-8">
        <Pressable className="flex-1 py-3 rounded-card items-center border border-gray-300" onPress={onBack}>
          <Text className="text-gray-600 font-medium">Back</Text>
        </Pressable>
        <Pressable
          className={`flex-1 py-4 rounded-card items-center ${saving ? 'bg-gray-400' : 'bg-sprout-600'}`}
          onPress={onConfirm}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Start Batch</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  )
}
