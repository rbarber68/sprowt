/**
 * SproutPal — Container Picker
 * Dropdown of user containers + inline "Add new" form
 */

import { View, Text, Pressable, TextInput, ScrollView } from 'react-native'
import { useState, useEffect } from 'react'
import { getAllContainers, addContainer } from '@/lib/containers'
import type { containers } from '@/db/schema'

interface ContainerPickerProps {
  selectedId: string | null
  onSelect: (id: string | null) => void
  yieldHint?: string | null
}

const CONTAINER_TYPES = [
  { value: 'quart_jar', label: 'Quart jar' },
  { value: 'half_gallon_jar', label: 'Half-gallon jar' },
  { value: 'pint_jar', label: 'Pint jar' },
  { value: 'wide_mouth_quart', label: 'Wide-mouth quart' },
  { value: 'sprouting_tray', label: 'Sprouting tray' },
  { value: 'custom', label: 'Custom' },
]

export function ContainerPicker({ selectedId, onSelect, yieldHint }: ContainerPickerProps) {
  const [containerList, setContainerList] = useState<(typeof containers.$inferSelect)[]>([])
  const [showAddNew, setShowAddNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('quart_jar')
  const [newCapacity, setNewCapacity] = useState('32')

  useEffect(() => {
    getAllContainers().then(setContainerList)
  }, [])

  const handleAddNew = async () => {
    if (!newName.trim()) return
    const id = await addContainer(newName.trim(), newType, parseFloat(newCapacity) || 32)
    onSelect(id)
    setShowAddNew(false)
    setNewName('')
    getAllContainers().then(setContainerList)
  }

  return (
    <View>
      <Text className="text-sm font-medium text-gray-500 mb-2">Container</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
        {containerList.map(c => (
          <Pressable
            key={c.id}
            className={`mr-2 px-3 py-2 rounded-chip border ${
              selectedId === c.id ? 'bg-sprout-600 border-sprout-600' : 'bg-white border-gray-200'
            }`}
            onPress={() => onSelect(selectedId === c.id ? null : c.id)}
          >
            <Text className={selectedId === c.id ? 'text-white text-sm' : 'text-gray-600 text-sm'}>
              {c.name}
            </Text>
            <Text className={selectedId === c.id ? 'text-white/70 text-xs' : 'text-gray-400 text-xs'}>
              {c.capacityOz > 0 ? `${c.capacityOz}oz` : 'flat'}
            </Text>
          </Pressable>
        ))}
        <Pressable
          className="px-3 py-2 rounded-chip border border-dashed border-sprout-400"
          onPress={() => setShowAddNew(!showAddNew)}
        >
          <Text className="text-sprout-600 text-sm">+ New</Text>
        </Pressable>
      </ScrollView>

      {yieldHint && (
        <View className="bg-sprout-50 rounded-card p-2 mb-2">
          <Text className="text-xs text-sprout-600">{yieldHint}</Text>
        </View>
      )}

      {showAddNew && (
        <View className="bg-gray-50 rounded-card p-3 mb-2">
          <TextInput
            className="bg-white rounded-card px-3 py-2 text-sm mb-2 border border-gray-200"
            placeholder="Container name"
            value={newName}
            onChangeText={setNewName}
            placeholderTextColor="#999"
          />
          <View className="flex-row gap-2 mb-2">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {CONTAINER_TYPES.map(t => (
                <Pressable
                  key={t.value}
                  className={`mr-1 px-2 py-1 rounded border ${
                    newType === t.value ? 'bg-sprout-100 border-sprout-400' : 'border-gray-200'
                  }`}
                  onPress={() => setNewType(t.value)}
                >
                  <Text className="text-xs">{t.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          <View className="flex-row gap-2 items-center">
            <TextInput
              className="bg-white rounded-card px-3 py-2 text-sm border border-gray-200 w-20"
              placeholder="oz"
              value={newCapacity}
              onChangeText={setNewCapacity}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            <Text className="text-xs text-gray-400">oz capacity</Text>
            <Pressable className="ml-auto bg-sprout-600 px-4 py-2 rounded-chip" onPress={handleAddNew}>
              <Text className="text-white text-sm font-medium">Add</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  )
}
