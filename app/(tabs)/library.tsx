import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal } from 'react-native'
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
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* Search bar */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <TextInput
          style={{ backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 }}
          placeholder="Search sprouts..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#999"
        />
      </View>

      {/* Difficulty filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        {DIFFICULTIES.map(d => (
          <TouchableOpacity
            key={d}
            activeOpacity={0.7}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 6,
              marginRight: 8,
              borderRadius: 9999,
              borderWidth: 1,
              backgroundColor: difficulty === d ? '#3B6D11' : '#ffffff',
              borderColor: difficulty === d ? '#3B6D11' : '#e5e7eb',
            }}
            onPress={() => setDifficulty(d)}
          >
            <Text style={{ color: difficulty === d ? '#ffffff' : '#4b5563', fontWeight: difficulty === d ? '500' : '400', fontSize: 14 }}>
              {d}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bean type grid */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {filtered.map(sprout => (
            <TouchableOpacity
              key={sprout.id}
              activeOpacity={0.7}
              style={{ width: '48%', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, marginBottom: 12 }}
              onPress={() => setSelectedSprout(sprout)}
            >
              <Text style={{ fontSize: 30, marginBottom: 8 }}>{sprout.emoji}</Text>
              <Text style={{ fontWeight: 'bold', color: '#27500A', marginBottom: 4 }}>{sprout.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>{sprout.growDays}d grow</Text>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>·</Text>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>{sprout.rinsesPerDay}x rinse</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <DifficultyBadge difficulty={sprout.difficulty} />
                {sprout.sulforaphaneRich && (
                  <View style={{ backgroundColor: '#C0DD97', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ color: '#27500A', fontSize: 10 }}>Sulforaphane</Text>
                  </View>
                )}
              </View>
              {TRAY_SPROUTS.includes(sprout.id) && (
                <Text style={{ fontSize: 10, color: '#854F0B', marginTop: 4 }}>Tray sprout</Text>
              )}
            </TouchableOpacity>
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
    easy:     { bg: '#C0DD97', text: '#27500A' },
    moderate: { bg: '#FAEEDA', text: '#854F0B' },
    hard:     { bg: '#FAECE7', text: '#993C1D' },
  }
  const c = config[difficulty] ?? config.easy

  return (
    <View style={{ backgroundColor: c.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
      <Text style={{ color: c.text, fontSize: 10, textTransform: 'capitalize' }}>{difficulty}</Text>
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
    <ScrollView style={{ flex: 1, backgroundColor: '#ffffff' }} contentContainerStyle={{ padding: 24 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 48, marginRight: 16 }}>{sprout.emoji}</Text>
          <View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#27500A' }}>{sprout.name}</Text>
            <DifficultyBadge difficulty={sprout.difficulty} />
          </View>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={{ padding: 8 }}>
          <Text style={{ fontSize: 24, color: '#9ca3af' }}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Growing parameters */}
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#27500A', marginBottom: 12 }}>Growing Parameters</Text>
      <View style={{ backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <ParamRow label="Soak time" value={`${sprout.soakHours} hours`} />
        <ParamRow label="Grow days" value={`${sprout.growDays} days`} />
        <ParamRow label="Rinses per day" value={`${sprout.rinsesPerDay}x`} />
        <ParamRow label="Temperature" value={`${sprout.minTempF}–${sprout.maxTempF}°F`} />
        <ParamRow label="Light" value={sprout.lightPreference} />
        <ParamRow label="Seed amount" value={`${sprout.seedAmountGrams}g per batch`} />
      </View>

      {/* Tips */}
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#27500A', marginBottom: 8 }}>Growing Tips</Text>
      <Text style={{ color: '#4b5563', marginBottom: 16, lineHeight: 20 }}>{sprout.notes}</Text>

      {/* Harvest hint */}
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#27500A', marginBottom: 8 }}>Harvest Guide</Text>
      <Text style={{ color: '#4b5563', marginBottom: 16, lineHeight: 20 }}>{sprout.harvestHint}</Text>

      {/* Science notes */}
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#185FA5', marginBottom: 8 }}>Science Notes</Text>
      <View style={{ backgroundColor: '#E6F1FB', borderWidth: 1, borderColor: '#85B7EB', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <Text style={{ color: '#374151', lineHeight: 20 }}>{sprout.gemmaContext}</Text>
      </View>

      {/* Fun fact */}
      <View style={{ backgroundColor: '#FAEEDA', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: '500', color: '#854F0B', marginBottom: 4 }}>Fun Fact</Text>
        <Text style={{ color: '#374151' }}>{sprout.funFact}</Text>
      </View>

      {/* Companion pairs */}
      {companions && companions.length > 0 && (
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#27500A', marginBottom: 8 }}>Great Companions</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {companions.map(id => {
              const comp = SPROUT_TYPES.find(s => s.id === id)
              if (!comp) return null
              return (
                <View key={id} style={{ backgroundColor: '#EAF3DE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 }}>
                  <Text style={{ color: '#27500A', fontSize: 14 }}>{comp.emoji} {comp.name}</Text>
                </View>
              )
            })}
          </View>
        </View>
      )}

      {/* Start batch button */}
      <TouchableOpacity
        activeOpacity={0.7}
        style={{ backgroundColor: '#3B6D11', paddingVertical: 16, borderRadius: 12, alignItems: 'center' }}
        onPress={onStartBatch}
      >
        <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 18 }}>Start a Batch</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

function ParamRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
      <Text style={{ color: '#6b7280', fontSize: 14 }}>{label}</Text>
      <Text style={{ color: '#27500A', fontWeight: '500', fontSize: 14, textTransform: 'capitalize' }}>{value}</Text>
    </View>
  )
}
