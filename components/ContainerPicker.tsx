/**
 * SproutPal — Container Picker
 * Dropdown of user containers + inline "Add new" form
 */

import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native'
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
      <Text style={{ fontSize: 14, fontWeight: '500', color: '#6b7280', marginBottom: 8 }}>Container</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        {containerList.map(c => (
          <TouchableOpacity
            key={c.id}
            activeOpacity={0.7}
            style={{
              marginRight: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 1,
              backgroundColor: selectedId === c.id ? '#3B6D11' : '#ffffff',
              borderColor: selectedId === c.id ? '#3B6D11' : '#e5e7eb',
            }}
            onPress={() => onSelect(selectedId === c.id ? null : c.id)}
          >
            <Text style={{ color: selectedId === c.id ? '#ffffff' : '#4b5563', fontSize: 14 }}>
              {c.name}
            </Text>
            <Text style={{ color: selectedId === c.id ? 'rgba(255,255,255,0.7)' : '#9ca3af', fontSize: 12 }}>
              {c.capacityOz > 0 ? `${c.capacityOz}oz` : 'flat'}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          activeOpacity={0.7}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: '#639922',
          }}
          onPress={() => setShowAddNew(!showAddNew)}
        >
          <Text style={{ color: '#3B6D11', fontSize: 14 }}>+ New</Text>
        </TouchableOpacity>
      </ScrollView>

      {yieldHint && (
        <View style={{ backgroundColor: '#EAF3DE', borderRadius: 12, padding: 8, marginBottom: 8 }}>
          <Text style={{ fontSize: 12, color: '#3B6D11' }}>{yieldHint}</Text>
        </View>
      )}

      {showAddNew && (
        <View style={{ backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, marginBottom: 8 }}>
          <TextInput
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 8,
              fontSize: 14,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: '#e5e7eb',
            }}
            placeholder="Container name"
            value={newName}
            onChangeText={setNewName}
            placeholderTextColor="#999"
          />
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {CONTAINER_TYPES.map(t => (
                <TouchableOpacity
                  key={t.value}
                  activeOpacity={0.7}
                  style={{
                    marginRight: 4,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 4,
                    borderWidth: 1,
                    backgroundColor: newType === t.value ? '#C0DD97' : 'transparent',
                    borderColor: newType === t.value ? '#639922' : '#e5e7eb',
                  }}
                  onPress={() => setNewType(t.value)}
                >
                  <Text style={{ fontSize: 12 }}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TextInput
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                fontSize: 14,
                borderWidth: 1,
                borderColor: '#e5e7eb',
                width: 80,
              }}
              placeholder="oz"
              value={newCapacity}
              onChangeText={setNewCapacity}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            <Text style={{ fontSize: 12, color: '#9ca3af' }}>oz capacity</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={{ marginLeft: 'auto', backgroundColor: '#3B6D11', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
              onPress={handleAddNew}
            >
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}
