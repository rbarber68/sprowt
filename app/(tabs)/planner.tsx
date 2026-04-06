import { View, Text, Pressable, ScrollView, Alert } from 'react-native'
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
    <View className="flex-1 bg-white">
      {/* Tab selector */}
      <View className="flex-row border-b border-gray-200">
        <Pressable
          className={`flex-1 py-3 items-center ${tab === 'planner' ? 'border-b-2 border-sprout-600' : ''}`}
          onPress={() => setTab('planner')}
        >
          <Text className={tab === 'planner' ? 'font-bold text-sprout-600' : 'text-gray-500'}>
            Planner
          </Text>
        </Pressable>
        <Pressable
          className={`flex-1 py-3 items-center ${tab === 'stagger' ? 'border-b-2 border-sprout-600' : ''}`}
          onPress={() => setTab('stagger')}
        >
          <Text className={tab === 'stagger' ? 'font-bold text-sprout-600' : 'text-gray-500'}>
            Stagger
          </Text>
        </Pressable>
      </View>

      {tab === 'planner' ? (
        <ScrollView className="flex-1 px-4 pt-4">
          {/* Sprout selector chips */}
          <Text className="text-sm font-medium text-gray-500 mb-2">Select a sprout type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {jarSprouts.map(s => (
              <Pressable
                key={s.id}
                className={`mr-2 px-3 py-2 rounded-chip border ${
                  selectedBeanId === s.id ? 'bg-sprout-600 border-sprout-600' : 'bg-white border-gray-200'
                }`}
                onPress={() => { setSelectedBeanId(s.id); setSelectedHarvestOffset(null) }}
              >
                <Text className={selectedBeanId === s.id ? 'text-white text-sm' : 'text-gray-600 text-sm'}>
                  {s.emoji} {s.name}
                </Text>
              </Pressable>
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
              <View className="bg-gray-50 rounded-card p-4 mt-4">
                <Text className="text-sm font-medium text-sprout-800 mb-2">Plan Summary</Text>
                <Text className="text-sm text-gray-600">
                  Soak: {selectedBean.soakHours}h → Grow: {selectedBean.growDays}d → {selectedBean.rinsesPerDay} rinses/day
                </Text>
                <Text className="text-sm text-gray-600 mt-1">
                  Temp: {selectedBean.minTempF}–{selectedBean.maxTempF}°F · Light: {selectedBean.lightPreference}
                </Text>
              </View>

              <Pressable
                className="bg-sprout-600 py-4 rounded-card items-center mt-4"
                onPress={() => router.push({ pathname: '/batch/new', params: { beanTypeId: selectedBean.id } })}
              >
                <Text className="text-white font-bold text-lg">Start This Batch</Text>
              </Pressable>
            </>
          )}

          {!selectedBean && (
            <View className="items-center py-12">
              <Text className="text-5xl mb-4">📅</Text>
              <Text className="text-gray-400 text-center">
                Pick a sprout type above to see the harvest timeline.
              </Text>
            </View>
          )}

          <View className="h-8" />
        </ScrollView>
      ) : (
        <ScrollView className="flex-1 px-4 pt-4">
          <Text className="text-lg font-bold text-sprout-800 mb-2">
            Fresh sprouts every...
          </Text>

          {/* Cadence selector */}
          <View className="flex-row gap-2 mb-4">
            {CADENCE_OPTIONS.map(c => (
              <Pressable
                key={c}
                className={`flex-1 py-3 rounded-card items-center border ${
                  cadence === c ? 'bg-sprout-600 border-sprout-600' : 'border-gray-200'
                }`}
                onPress={() => { setCadence(c); setStaggerPlan([]) }}
              >
                <Text className={cadence === c ? 'text-white font-bold' : 'text-gray-600'}>
                  {c}d
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Bean type multi-select */}
          <Text className="text-sm font-medium text-gray-500 mb-2">Select 2+ sprout types</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {jarSprouts.map(s => (
              <Pressable
                key={s.id}
                className={`px-3 py-2 rounded-chip border ${
                  staggerBeanIds.includes(s.id) ? 'bg-sprout-100 border-sprout-400' : 'border-gray-200'
                }`}
                onPress={() => toggleStaggerBean(s.id)}
              >
                <Text className={staggerBeanIds.includes(s.id) ? 'text-sprout-800 text-sm' : 'text-gray-600 text-sm'}>
                  {s.emoji} {s.name}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Generate button */}
          <Pressable
            className={`py-3 rounded-card items-center mb-4 ${
              staggerBeanIds.length >= 2 ? 'bg-sprout-600' : 'bg-gray-300'
            }`}
            onPress={generatePlan}
            disabled={staggerBeanIds.length < 2}
          >
            <Text className="text-white font-bold">Generate Plan</Text>
          </Pressable>

          {/* Stagger calendar */}
          <StaggerCalendar plan={staggerPlan} />

          {staggerPlan.length > 0 && (
            <Pressable
              className="bg-sprout-600 py-4 rounded-card items-center mt-4"
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
              <Text className="text-white font-bold text-lg">
                Activate Plan ({staggerPlan.length} batches)
              </Text>
            </Pressable>
          )}

          <View className="h-8" />
        </ScrollView>
      )}
    </View>
  )
}
