import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native'
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
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Progress dots */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', paddingVertical: 16, gap: 8 }}>
        {([0, 1, 2, 3, 4] as Step[]).map(s => (
          <View
            key={s}
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: s === step ? '#3B6D11' : s < step ? '#97C459' : '#e5e7eb',
            }}
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
  const allSprouts = SPROUT_TYPES

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#27500A', marginBottom: 4 }}>Pick your sprout</Text>
      <Text style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>Tap to select, then hit Next.</Text>

      {allSprouts.map(s => {
        const selected = selectedId === s.id
        const isTray = TRAY_SPROUTS.includes(s.id)
        return (
          <TouchableOpacity
            key={s.id}
            activeOpacity={0.7}
            onPress={() => onSelect(s.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 14,
              marginBottom: 8,
              borderRadius: 14,
              borderWidth: 2,
              borderColor: selected ? '#639922' : '#e5e7eb',
              backgroundColor: selected ? '#EAF3DE' : '#fff',
            }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: selected ? '#3B6D11' : '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Text style={{ fontSize: 22 }}>{s.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold', color: '#27500A', fontSize: 15 }}>{s.name}</Text>
              <Text style={{ color: '#888', fontSize: 11, marginTop: 2 }}>
                {s.growDays}d {'\u00b7'} {s.difficulty} {'\u00b7'} {s.rinsesPerDay}x rinse{isTray ? ' \u00b7 tray' : ''}
              </Text>
            </View>
            {selected && (
              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#639922', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{'\u2713'}</Text>
              </View>
            )}
          </TouchableOpacity>
        )
      })}

      {selectedId && (
        <View style={{ backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, marginTop: 4, marginBottom: 8 }}>
          <Text style={{ color: '#555', fontSize: 13, lineHeight: 20 }}>
            {SPROUT_TYPES.find(s => s.id === selectedId)?.notes}
          </Text>
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => { if (selectedId) onNext() }}
        style={{
          paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8,
          backgroundColor: selectedId ? '#3B6D11' : '#d1d5db',
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Next</Text>
      </TouchableOpacity>
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
    <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#27500A', marginBottom: 8 }}>Seed source</Text>
      <Text style={{ color: '#6b7280', marginBottom: 16 }}>Optional: track where your seeds came from</Text>

      {existingSources.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#6b7280', marginBottom: 8 }}>Previous sources</Text>
          {existingSources.map(src => (
            <TouchableOpacity
              key={src.id}
              activeOpacity={0.7}
              style={{
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                marginBottom: 8,
                backgroundColor: selectedSourceId === src.id ? '#EAF3DE' : '#fff',
                borderColor: selectedSourceId === src.id ? '#639922' : '#e5e7eb',
              }}
              onPress={() => {
                onSelectSource(selectedSourceId === src.id ? null : src.id)
                onNewSupplier('')
              }}
            >
              <Text style={{ fontWeight: '500', color: '#27500A' }}>{src.supplierName}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={{ fontSize: 14, fontWeight: '500', color: '#6b7280', marginBottom: 8 }}>Or add a new source</Text>
      <TextInput
        style={{
          backgroundColor: '#f3f4f6',
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          fontSize: 16,
          marginBottom: 16,
        }}
        placeholder="Supplier name (e.g., Mumm's)"
        value={newSupplier}
        onChangeText={(text) => {
          onNewSupplier(text)
          onSelectSource(null)
        }}
        placeholderTextColor="#999"
      />

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32 }}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db' }}
          onPress={onBack}
        >
          <Text style={{ color: '#6b7280', fontWeight: '500' }}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#3B6D11' }}
          onPress={onNext}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Next</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity activeOpacity={0.7} style={{ alignItems: 'center', marginBottom: 32 }} onPress={onNext}>
        <Text style={{ color: '#639922', fontSize: 14 }}>Skip seed tracking</Text>
      </TouchableOpacity>
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
    <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#27500A', marginBottom: 16 }}>Jar &amp; Timing</Text>

      <Text style={{ fontSize: 14, fontWeight: '500', color: '#6b7280', marginBottom: 8 }}>Seed amount (grams)</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <TextInput
          style={{
            backgroundColor: '#f3f4f6',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            flex: 1,
          }}
          value={seedAmount}
          onChangeText={onSeedAmount}
          keyboardType="numeric"
          placeholder="20"
          placeholderTextColor="#999"
        />
        <Text style={{ fontSize: 14, color: '#9ca3af' }}>grams</Text>
      </View>

      <ContainerPicker
        selectedId={containerId}
        onSelect={onContainerId}
        yieldHint={yieldHint}
      />

      <View style={{ height: 12 }} />

      <Text style={{ fontSize: 14, fontWeight: '500', color: '#6b7280', marginBottom: 8 }}>Jar label</Text>
      <TextInput
        style={{
          backgroundColor: '#f3f4f6',
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          fontSize: 16,
          marginBottom: 16,
        }}
        value={jarLabel}
        onChangeText={onJarLabel}
        placeholder="Jar A"
        placeholderTextColor="#999"
      />

      <Text style={{ fontSize: 14, fontWeight: '500', color: '#6b7280', marginBottom: 8 }}>When to start?</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            alignItems: 'center',
            backgroundColor: startNow ? '#EAF3DE' : '#fff',
            borderColor: startNow ? '#639922' : '#e5e7eb',
          }}
          onPress={() => onStartNow(true)}
        >
          <Text style={{ fontWeight: startNow ? 'bold' : '400', color: startNow ? '#27500A' : '#6b7280' }}>Start now</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            alignItems: 'center',
            backgroundColor: !startNow ? '#EAF3DE' : '#fff',
            borderColor: !startNow ? '#639922' : '#e5e7eb',
          }}
          onPress={() => onStartNow(false)}
        >
          <Text style={{ fontWeight: !startNow ? 'bold' : '400', color: !startNow ? '#27500A' : '#6b7280' }}>Plan for date</Text>
        </TouchableOpacity>
      </View>

      {/* Timeline summary */}
      <View style={{ backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: '500', color: '#27500A', marginBottom: 8 }}>Timeline</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ fontSize: 14, color: '#6b7280' }}>Soak</Text>
          <Text style={{ fontSize: 14, color: '#3B6D11' }}>{bean.soakHours}h starting today</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ fontSize: 14, color: '#6b7280' }}>Grow</Text>
          <Text style={{ fontSize: 14, color: '#3B6D11' }}>{bean.growDays} days</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 14, color: '#6b7280' }}>Harvest</Text>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#27500A' }}>
            {harvestDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32 }}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db' }}
          onPress={onBack}
        >
          <Text style={{ color: '#6b7280', fontWeight: '500' }}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#3B6D11' }}
          onPress={onNext}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Next</Text>
        </TouchableOpacity>
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
  const cardBorderColor =
    character.rarity === 'legendary' ? '#EF9F27' :
    character.rarity === 'rare' ? '#85B7EB' :
    '#97C459'
  const cardBgColor =
    character.rarity === 'legendary' ? '#FAEEDA' :
    character.rarity === 'rare' ? '#E6F1FB' :
    '#EAF3DE'
  const badgeBgColor =
    character.rarity === 'legendary' ? '#EF9F27' :
    character.rarity === 'rare' ? '#85B7EB' :
    character.rarity === 'uncommon' ? '#97C459' :
    '#e5e7eb'

  return (
    <ScrollView style={{ flex: 1, backgroundColor: cardBgColor }} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Big hero avatar area */}
      <View style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 24 }}>
        <View style={{
          width: 140, height: 140, borderRadius: 70,
          backgroundColor: character.faceColor + '30',
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 3, borderColor: cardBorderColor,
          shadowColor: cardBorderColor, shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
        }}>
          <CharacterAvatar
            faceColor={character.faceColor}
            eyeColor={character.eyeColor}
            eyeShape={character.eyeShape}
            mouth={character.mouth}
            accessoryEmoji={character.accessoryEmoji}
            size={100}
            animation="reveal"
          />
        </View>

        <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#27500A', marginTop: 16 }}>{character.name}</Text>

        {/* Rarity badge */}
        <View style={{
          paddingHorizontal: 16, paddingVertical: 5, borderRadius: 20, marginTop: 8,
          backgroundColor: badgeBgColor,
          shadowColor: badgeBgColor, shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
        }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase',
            color: character.rarity === 'common' ? '#374151' : '#fff' }}>{character.rarity}</Text>
        </View>

        <Text style={{ fontSize: 15, color: '#3B6D11', marginTop: 8, fontWeight: '600' }}>{character.personalityLabel}</Text>
      </View>

      {/* Catchphrase card */}
      <View style={{ marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
        <Text style={{ fontSize: 15, color: '#6b7280', fontStyle: 'italic', textAlign: 'center', lineHeight: 22 }}>
          "{character.catchphrase}"
        </Text>
      </View>

      {/* Traits as tag pills */}
      <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
        <Text style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Character Traits</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[
            { icon: '\ud83c\udf99\ufe0f', label: character.voiceStyle },
            { icon: '\ud83d\ude28', label: `Fears: ${character.secretFear}` },
            { icon: '\u2728', label: character.hiddenTalent },
            { icon: '\ud83d\udca7', label: character.waterAttitude },
          ].map((trait, i) => (
            <View key={i} style={{ backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
              borderWidth: 1, borderColor: '#e5e7eb', flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, marginRight: 6 }}>{trait.icon}</Text>
              <Text style={{ fontSize: 12, color: '#4b5563', flexShrink: 1 }}>{trait.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Action buttons */}
      <View style={{ flexDirection: 'row', gap: 12, marginHorizontal: 20, marginTop: 8 }}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' }}
          onPress={onBack}
        >
          <Text style={{ color: '#6b7280', fontWeight: '500' }}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#BA7517' }}
          onPress={onReroll}
        >
          <Text style={{ color: '#BA7517', fontWeight: '500' }}>Re-roll</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        style={{ width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#3B6D11', marginBottom: 32 }}
        onPress={onNext}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Keep this one</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

function TraitRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={{ fontSize: 12, color: '#9ca3af' }}>{label}</Text>
      <Text style={{ fontSize: 12, color: '#6b7280', flex: 1, textAlign: 'right' }}>{value}</Text>
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
    <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#27500A', marginBottom: 16 }}>Confirm your batch</Text>

      <View style={{ backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 30, marginRight: 12 }}>{bean.emoji}</Text>
          <View>
            <Text style={{ fontWeight: 'bold', color: '#27500A' }}>{bean.name}</Text>
            <Text style={{ fontSize: 14, color: '#6b7280' }}>{jarLabel}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <CharacterAvatar
            faceColor={character.faceColor}
            eyeColor={character.eyeColor}
            eyeShape={character.eyeShape}
            mouth={character.mouth}
            accessoryEmoji={character.accessoryEmoji}
            size={32}
          />
          <Text style={{ marginLeft: 8, fontSize: 14, color: '#6b7280' }}>{character.name} ({character.personalityLabel})</Text>
        </View>
        <View style={{ borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 14, color: '#6b7280' }}>Start soak</Text>
            <Text style={{ fontSize: 14, color: '#27500A' }}>Now</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 14, color: '#6b7280' }}>Drain to jar</Text>
            <Text style={{ fontSize: 14, color: '#27500A' }}>In {bean.soakHours}h</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 14, color: '#6b7280' }}>Target harvest</Text>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#27500A' }}>
              {harvestDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          </View>
        </View>
      </View>

      {/* Rinse schedule */}
      <View style={{
        backgroundColor: '#E6F1FB',
        borderWidth: 1,
        borderColor: '#85B7EB',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
      }}>
        <Text style={{ fontSize: 14, fontWeight: '500', color: '#185FA5', marginBottom: 8 }}>Rinse reminders</Text>
        <Text style={{ fontSize: 14, color: '#6b7280' }}>7:00 AM · 3:00 PM · 11:00 PM</Text>
        <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Change default times in Settings</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32 }}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db' }}
          onPress={onBack}
        >
          <Text style={{ color: '#6b7280', fontWeight: '500' }}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ flex: 1, paddingVertical: saving ? 12 : 16, borderRadius: 12, alignItems: 'center', backgroundColor: saving ? '#9ca3af' : '#3B6D11' }}
          onPress={onConfirm}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Start Batch</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
