import { View, Text, Pressable, ScrollView, TextInput, Modal } from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import { SPROUT_TYPES, TRAY_SPROUTS, COMPANION_PAIRS, type BeanType } from '@/data/sproutTypes'

const DIFFICULTIES = ['All', 'Easy', 'Moderate', 'Hard'] as const

export default function LibraryScreen() {
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState<string>('All')
  const [selectedSprout, setSelectedSprout] = useState<BeanType | null>(null)

  const filtered = SPROUT_TYPES.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase())
    const matchesDifficulty = difficulty === 'All' || s.difficulty === difficulty.toLowerCase()
    return matchesSearch && matchesDifficulty
  })

  return (
    <View className="flex-1 bg-white">
      {/* Search bar */}
      <View className="px-4 pt-4 pb-2">
        <TextInput
          className="bg-gray-100 rounded-card px-4 py-3 text-base"
          placeholder="Search sprouts..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#999"
        />
      </View>

      {/* Difficulty filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-2">
        {DIFFICULTIES.map(d => (
          <Pressable
            key={d}
            className={`px-4 py-1.5 mr-2 rounded-chip border ${
              difficulty === d
                ? 'bg-sprout-600 border-sprout-600'
                : 'bg-white border-gray-200'
            }`}
            onPress={() => setDifficulty(d)}
          >
            <Text className={difficulty === d ? 'text-white font-medium text-sm' : 'text-gray-600 text-sm'}>
              {d}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Bean type grid */}
      <ScrollView className="flex-1 px-4">
        <View className="flex-row flex-wrap justify-between pb-6">
          {filtered.map(sprout => (
            <Pressable
              key={sprout.id}
              className="w-[48%] bg-white border border-gray-200 rounded-card p-4 mb-3"
              onPress={() => setSelectedSprout(sprout)}
            >
              <Text className="text-3xl mb-2">{sprout.emoji}</Text>
              <Text className="font-bold text-sprout-800 mb-1">{sprout.name}</Text>
              <View className="flex-row items-center gap-2 mb-1">
                <Text className="text-xs text-gray-500">{sprout.growDays}d grow</Text>
                <Text className="text-xs text-gray-500">·</Text>
                <Text className="text-xs text-gray-500">{sprout.rinsesPerDay}x rinse</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <DifficultyBadge difficulty={sprout.difficulty} />
                {sprout.sulforaphaneRich && (
                  <View className="bg-sprout-100 px-1.5 py-0.5 rounded">
                    <Text className="text-sprout-800 text-[10px]">Sulforaphane</Text>
                  </View>
                )}
              </View>
              {TRAY_SPROUTS.includes(sprout.id) && (
                <Text className="text-[10px] text-soak-600 mt-1">Tray sprout</Text>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Detail modal */}
      <Modal
        visible={selectedSprout !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedSprout(null)}
      >
        {selectedSprout && (
          <SproutDetail
            sprout={selectedSprout}
            onClose={() => setSelectedSprout(null)}
            onStartBatch={() => {
              setSelectedSprout(null)
              router.push({ pathname: '/batch/new', params: { beanTypeId: selectedSprout.id } })
            }}
          />
        )}
      </Modal>
    </View>
  )
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    easy:     { bg: 'bg-sprout-100', text: 'text-sprout-800' },
    moderate: { bg: 'bg-soak-50',    text: 'text-soak-600' },
    hard:     { bg: 'bg-alert-50',   text: 'text-alert-600' },
  }
  const c = config[difficulty] ?? config.easy

  return (
    <View className={`${c.bg} px-1.5 py-0.5 rounded`}>
      <Text className={`${c.text} text-[10px] capitalize`}>{difficulty}</Text>
    </View>
  )
}

function SproutDetail({
  sprout,
  onClose,
  onStartBatch,
}: {
  sprout: BeanType
  onClose: () => void
  onStartBatch: () => void
}) {
  const companions = COMPANION_PAIRS[sprout.id]

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        {/* Header */}
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-row items-center">
            <Text className="text-5xl mr-4">{sprout.emoji}</Text>
            <View>
              <Text className="text-2xl font-bold text-sprout-800">{sprout.name}</Text>
              <DifficultyBadge difficulty={sprout.difficulty} />
            </View>
          </View>
          <Pressable onPress={onClose} className="p-2">
            <Text className="text-2xl text-gray-400">✕</Text>
          </Pressable>
        </View>

        {/* Growing parameters */}
        <Text className="text-lg font-bold text-sprout-800 mb-3">Growing Parameters</Text>
        <View className="bg-gray-50 rounded-card p-4 mb-4">
          <ParamRow label="Soak time" value={`${sprout.soakHours} hours`} />
          <ParamRow label="Grow days" value={`${sprout.growDays} days`} />
          <ParamRow label="Rinses per day" value={`${sprout.rinsesPerDay}x`} />
          <ParamRow label="Temperature" value={`${sprout.minTempF}–${sprout.maxTempF}°F`} />
          <ParamRow label="Light" value={sprout.lightPreference} />
          <ParamRow label="Seed amount" value={`${sprout.seedAmountGrams}g per batch`} />
        </View>

        {/* Tips */}
        <Text className="text-lg font-bold text-sprout-800 mb-2">Growing Tips</Text>
        <Text className="text-gray-600 mb-4 leading-5">{sprout.notes}</Text>

        {/* Harvest hint */}
        <Text className="text-lg font-bold text-sprout-800 mb-2">Harvest Guide</Text>
        <Text className="text-gray-600 mb-4 leading-5">{sprout.harvestHint}</Text>

        {/* Science notes */}
        <Text className="text-lg font-bold text-info-600 mb-2">Science Notes</Text>
        <View className="bg-info-50 border border-info-200 rounded-card p-4 mb-4">
          <Text className="text-gray-700 leading-5">{sprout.gemmaContext}</Text>
        </View>

        {/* Fun fact */}
        <View className="bg-soak-50 rounded-card p-4 mb-4">
          <Text className="text-sm font-medium text-soak-600 mb-1">Fun Fact</Text>
          <Text className="text-gray-700">{sprout.funFact}</Text>
        </View>

        {/* Companion pairs */}
        {companions && companions.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-bold text-sprout-800 mb-2">Great Companions</Text>
            <View className="flex-row gap-2">
              {companions.map(id => {
                const comp = SPROUT_TYPES.find(s => s.id === id)
                if (!comp) return null
                return (
                  <View key={id} className="bg-sprout-50 px-3 py-1.5 rounded-chip">
                    <Text className="text-sprout-800 text-sm">{comp.emoji} {comp.name}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {/* Start batch button */}
        <Pressable
          className="bg-sprout-600 py-4 rounded-card items-center"
          onPress={onStartBatch}
        >
          <Text className="text-white font-bold text-lg">Start a Batch</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

function ParamRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1.5 border-b border-gray-200 last:border-0">
      <Text className="text-gray-500 text-sm">{label}</Text>
      <Text className="text-sprout-800 font-medium text-sm capitalize">{value}</Text>
    </View>
  )
}
