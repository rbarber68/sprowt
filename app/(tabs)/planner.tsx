import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import { uuidv4 } from '@/lib/uuid'
import { SPROUT_TYPES, TRAY_SPROUTS } from '@/data/sproutTypes'
import { generateStaggerPlan, type StaggerBatch } from '@/lib/stagger'
import { generateCharacter } from '@/data/characters'
import { HarvestPlanner } from '@/components/HarvestPlanner'
import { StaggerCalendar } from '@/components/StaggerCalendar'
import { db } from '@/db/client'
import { batches, characters, staggerPlans } from '@/db/schema'

type PlannerTab = 'planner' | 'stagger'
const CADENCE_OPTIONS = [1, 2, 3, 5]

export default function PlannerScreen() {
  const [tab, setTab] = useState<PlannerTab>('planner')
  const [selectedBeanId, setSelectedBeanId] = useState<string | null>(null)
  const [selectedHarvestOffset, setSelectedHarvestOffset] = useState<number | null>(null)

  // Stagger state
  const [cadence, setCadence] = useState(2)
  const [staggerBeanIds, setStaggerBeanIds] = useState<string[]>([])
  const [staggerPlan, setStaggerPlan] = useState<StaggerBatch[]>([])

  const jarSprouts = SPROUT_TYPES.filter(s => !TRAY_SPROUTS.includes(s.id))
  const selectedBean = SPROUT_TYPES.find(s => s.id === selectedBeanId)

  const toggleStaggerBean = (id: string) => {
    setStaggerBeanIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
    setStaggerPlan([]) // reset plan when selection changes
  }

  const generatePlan = () => {
    if (staggerBeanIds.length === 0) return
    const plan = generateStaggerPlan(cadence, staggerBeanIds)
    setStaggerPlan(plan)
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* Tab selector */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            borderBottomWidth: tab === 'planner' ? 2 : 0,
            borderBottomColor: tab === 'planner' ? '#3B6D11' : 'transparent',
          }}
          onPress={() => setTab('planner')}
        >
          <Text style={{ fontWeight: tab === 'planner' ? 'bold' : '400', color: tab === 'planner' ? '#3B6D11' : '#6b7280' }}>
            Planner
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            borderBottomWidth: tab === 'stagger' ? 2 : 0,
            borderBottomColor: tab === 'stagger' ? '#3B6D11' : 'transparent',
          }}
          onPress={() => setTab('stagger')}
        >
          <Text style={{ fontWeight: tab === 'stagger' ? 'bold' : '400', color: tab === 'stagger' ? '#3B6D11' : '#6b7280' }}>
            Stagger
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'planner' ? (
        <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Sprout selector chips */}
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#6b7280', marginBottom: 8 }}>Select a sprout type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {jarSprouts.map(s => (
              <TouchableOpacity
                key={s.id}
                activeOpacity={0.7}
                style={{
                  marginRight: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 9999,
                  borderWidth: 1,
                  backgroundColor: selectedBeanId === s.id ? '#3B6D11' : '#ffffff',
                  borderColor: selectedBeanId === s.id ? '#3B6D11' : '#e5e7eb',
                }}
                onPress={() => { setSelectedBeanId(s.id); setSelectedHarvestOffset(null) }}
              >
                <Text style={{ color: selectedBeanId === s.id ? '#ffffff' : '#4b5563', fontSize: 14 }}>
                  {s.emoji} {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Timeline when selected */}
          {selectedBean && (
            <>
              <HarvestPlanner
                beanName={selectedBean.name}
                beanEmoji={selectedBean.emoji}
                soakDate={new Date()}
                jarDate={new Date(Date.now() + selectedBean.soakHours * 3600000)}
                harvestDate={new Date(Date.now() + (selectedBean.soakHours / 24 + selectedBean.growDays) * 86400000)}
              />

              {/* Plan summary */}
              <View style={{ backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, marginTop: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#27500A', marginBottom: 8 }}>Plan Summary</Text>
                <Text style={{ fontSize: 14, color: '#4b5563' }}>
                  Soak: {selectedBean.soakHours}h → Grow: {selectedBean.growDays}d → {selectedBean.rinsesPerDay} rinses/day
                </Text>
                <Text style={{ fontSize: 14, color: '#4b5563', marginTop: 4 }}>
                  Temp: {selectedBean.minTempF}–{selectedBean.maxTempF}°F · Light: {selectedBean.lightPreference}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                style={{ backgroundColor: '#3B6D11', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 }}
                onPress={() => router.push({ pathname: '/batch/new', params: { beanTypeId: selectedBean.id } })}
              >
                <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 18 }}>Start This Batch</Text>
              </TouchableOpacity>
            </>
          )}

          {!selectedBean && (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>📅</Text>
              <Text style={{ color: '#9ca3af', textAlign: 'center' }}>
                Pick a sprout type above to see the harvest timeline.
              </Text>
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      ) : (
        <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }} contentContainerStyle={{ paddingBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#27500A', marginBottom: 8 }}>
            Fresh sprouts every...
          </Text>

          {/* Cadence selector */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {CADENCE_OPTIONS.map(c => (
              <TouchableOpacity
                key={c}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  backgroundColor: cadence === c ? '#3B6D11' : '#ffffff',
                  borderColor: cadence === c ? '#3B6D11' : '#e5e7eb',
                }}
                onPress={() => { setCadence(c); setStaggerPlan([]) }}
              >
                <Text style={{ color: cadence === c ? '#ffffff' : '#4b5563', fontWeight: cadence === c ? 'bold' : '400' }}>
                  {c}d
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bean type multi-select */}
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#6b7280', marginBottom: 8 }}>Select 2+ sprout types</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {jarSprouts.map(s => (
              <TouchableOpacity
                key={s.id}
                activeOpacity={0.7}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 9999,
                  borderWidth: 1,
                  backgroundColor: staggerBeanIds.includes(s.id) ? '#C0DD97' : '#ffffff',
                  borderColor: staggerBeanIds.includes(s.id) ? '#639922' : '#e5e7eb',
                }}
                onPress={() => toggleStaggerBean(s.id)}
              >
                <Text style={{ color: staggerBeanIds.includes(s.id) ? '#27500A' : '#4b5563', fontSize: 14 }}>
                  {s.emoji} {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Generate button */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={{
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: 'center',
              marginBottom: 16,
              backgroundColor: staggerBeanIds.length >= 2 ? '#3B6D11' : '#d1d5db',
            }}
            onPress={generatePlan}
            disabled={staggerBeanIds.length < 2}
          >
            <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>Generate Plan</Text>
          </TouchableOpacity>

          {/* Stagger calendar */}
          <StaggerCalendar plan={staggerPlan} />

          {staggerPlan.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              style={{ backgroundColor: '#3B6D11', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 }}
              onPress={async () => {
                Alert.alert(
                  'Activate stagger plan?',
                  `This will create ${staggerPlan.length} batches with rolling start dates.`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Activate',
                      onPress: async () => {
                        const planId = uuidv4()
                        const now = Date.now()

                        await db.insert(staggerPlans).values({
                          id: planId,
                          cadenceDays: cadence,
                          beanTypeMix: JSON.stringify(staggerBeanIds),
                          createdAt: now,
                        })

                        for (let i = 0; i < staggerPlan.length; i++) {
                          const sp = staggerPlan[i]
                          const char = generateCharacter(sp.beanTypeId)
                          const characterId = uuidv4()

                          await db.insert(characters).values({
                            id: characterId,
                            name: char.name,
                            personality: char.personality,
                            voiceStyle: char.voiceStyle,
                            waterAttitude: char.waterAttitude,
                            harvestAttitude: char.harvestAttitude,
                            secretFear: char.secretFear,
                            hiddenTalent: char.hiddenTalent,
                            catchphrase: char.catchphrase,
                            rarity: char.rarity,
                            faceColor: char.faceColor,
                            eyeColor: char.eyeColor,
                            eyeShape: char.eyeShape,
                            mouth: char.mouth,
                            accessoryEmoji: char.accessoryEmoji,
                            accessoryName: char.accessoryName,
                            traitsJson: JSON.stringify(char),
                          })

                          await db.insert(batches).values({
                            id: uuidv4(),
                            beanTypeId: sp.beanTypeId,
                            characterId,
                            jarLabel: `Jar ${String.fromCharCode(65 + i)}`,
                            status: sp.dayOffset === 0 ? 'soaking' : 'soaking',
                            soakStartAt: sp.soakStartDate.getTime(),
                            jarStartAt: sp.jarStartDate.getTime(),
                            targetHarvestAt: sp.harvestDate.getTime(),
                            createdAt: now,
                            updatedAt: now,
                          })
                        }

                        router.push('/(tabs)')
                      },
                    },
                  ]
                )
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 18 }}>
                Activate Plan ({staggerPlan.length} batches)
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  )
}
