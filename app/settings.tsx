import { View, Text, Pressable, ScrollView, TextInput, Alert } from 'react-native'
import { useState, useEffect } from 'react'
import { getKVStore, setKVStore, KV_KEYS } from '@/lib/kvstore'
import { db } from '@/db/client'
import { batches, characters, beanTypes, dailyLogs, seedSources, seedAdjustments, staggerPlans } from '@/db/schema'
import { getAllContainers, deleteContainer } from '@/lib/containers'
import type { containers as containersTable } from '@/db/schema'
import * as Sharing from 'expo-sharing'
import * as DocumentPicker from 'expo-document-picker'
import { Paths, File } from 'expo-file-system/next'

export default function SettingsScreen() {
  const [viewMode, setViewMode] = useState<'fun' | 'business'>('fun')
  const [notifVoice, setNotifVoice] = useState<'character' | 'terse'>('character')
  const [coachIntensity, setCoachIntensity] = useState<'minimal' | 'moderate' | 'full'>('full')
  const [containerList, setContainerList] = useState<(typeof containersTable.$inferSelect)[]>([])
  const [rinseTime1, setRinseTime1] = useState('07:00')
  const [rinseTime2, setRinseTime2] = useState('15:00')
  const [rinseTime3, setRinseTime3] = useState('23:00')
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [soundsMuted, setSoundsMuted] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true)

  useEffect(() => {
    setViewMode((getKVStore(KV_KEYS.VIEW_MODE) as 'fun' | 'business') ?? 'fun')
    setNotifVoice((getKVStore(KV_KEYS.NOTIFICATION_VOICE) as 'character' | 'terse') ?? 'character')
    setRinseTime1(getKVStore(KV_KEYS.RINSE_TIME_1) ?? '07:00')
    setRinseTime2(getKVStore(KV_KEYS.RINSE_TIME_2) ?? '15:00')
    setRinseTime3(getKVStore(KV_KEYS.RINSE_TIME_3) ?? '23:00')
    setApiKey(getKVStore(KV_KEYS.GOOGLE_AI_API_KEY) ?? '')
    setCoachIntensity((getKVStore(KV_KEYS.COACH_INTENSITY) as any) ?? 'full')
    getAllContainers().then(setContainerList)
    setSoundsMuted(getKVStore(KV_KEYS.SOUNDS_MUTED) === 'true')
    setTtsEnabled(getKVStore(KV_KEYS.TTS_ENABLED) !== 'false')
  }, [])

  const toggleViewMode = () => {
    const next = viewMode === 'fun' ? 'business' : 'fun'
    setViewMode(next)
    setKVStore(KV_KEYS.VIEW_MODE, next)
  }

  const toggleNotifVoice = () => {
    const next = notifVoice === 'character' ? 'terse' : 'character'
    setNotifVoice(next)
    setKVStore(KV_KEYS.NOTIFICATION_VOICE, next)
  }

  const saveRinseTimes = () => {
    setKVStore(KV_KEYS.RINSE_TIME_1, rinseTime1)
    setKVStore(KV_KEYS.RINSE_TIME_2, rinseTime2)
    setKVStore(KV_KEYS.RINSE_TIME_3, rinseTime3)
    Alert.alert('Saved', 'Rinse times updated. Active batches will use new times on next notification cycle.')
  }

  const saveApiKey = () => {
    setKVStore(KV_KEYS.GOOGLE_AI_API_KEY, apiKey)
    Alert.alert('Saved', 'API key stored.')
  }

  const importData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      })

      if (result.canceled || !result.assets?.[0]) return

      const file = new File(result.assets[0].uri)
      const json = await file.text()
      const data = JSON.parse(json)

      if (!data.version || !data.batches) {
        Alert.alert('Invalid backup', 'This file does not appear to be a valid SproutPal backup.')
        return
      }

      Alert.alert(
        'Import backup?',
        `This will add ${data.batches.length} batches and ${data.characters?.length ?? 0} characters. Existing data will not be deleted.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            onPress: async () => {
              try {
                // Import characters first (batches reference them)
                if (data.characters) {
                  for (const c of data.characters) {
                    await db.insert(characters).values(c).onConflictDoNothing()
                  }
                }
                if (data.seedSources) {
                  for (const s of data.seedSources) {
                    await db.insert(seedSources).values(s).onConflictDoNothing()
                  }
                }
                if (data.batches) {
                  for (const b of data.batches) {
                    await db.insert(batches).values(b).onConflictDoNothing()
                  }
                }
                if (data.dailyLogs) {
                  for (const l of data.dailyLogs) {
                    await db.insert(dailyLogs).values(l).onConflictDoNothing()
                  }
                }
                Alert.alert('Import complete', 'Data imported successfully.')
              } catch (e) {
                Alert.alert('Import error', String(e))
              }
            },
          },
        ]
      )
    } catch (e) {
      Alert.alert('Import failed', String(e))
    }
  }

  const exportData = async () => {
    try {
      const data = {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        batches: await db.select().from(batches),
        characters: await db.select().from(characters),
        beanTypes: await db.select().from(beanTypes),
        dailyLogs: await db.select().from(dailyLogs),
        seedSources: await db.select().from(seedSources),
        seedAdjustments: await db.select().from(seedAdjustments),
        staggerPlans: await db.select().from(staggerPlans),
      }

      const json = JSON.stringify(data, null, 2)
      const file = new File(Paths.document, 'sproutpal-backup.json')
      file.create()
      file.write(json)
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json' })
    } catch (e) {
      Alert.alert('Export failed', String(e))
    }
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        {/* View Mode */}
        <SettingSection title="View Mode">
          <ToggleRow
            label={viewMode === 'fun' ? 'Fun Mode' : 'Business Mode'}
            description={viewMode === 'fun' ? 'Character cards with personalities' : 'Data-driven dashboard view'}
            onToggle={toggleViewMode}
            active={viewMode === 'fun'}
            activeLabel="Fun"
            inactiveLabel="Business"
          />
        </SettingSection>

        {/* Notification Voice */}
        <SettingSection title="Notification Voice">
          <ToggleRow
            label={notifVoice === 'character' ? 'Character Voice' : 'Terse Mode'}
            description={notifVoice === 'character' ? 'Notifications in character personality' : 'Short, data-driven notifications'}
            onToggle={toggleNotifVoice}
            active={notifVoice === 'character'}
            activeLabel="Character"
            inactiveLabel="Terse"
          />
        </SettingSection>

        {/* Sound & Voice */}
        <SettingSection title="Sound & Voice">
          <ToggleRow
            label={soundsMuted ? 'Sound Effects Off' : 'Sound Effects On'}
            description="Play sounds for rinses, harvests, and character reveals"
            onToggle={() => {
              const next = !soundsMuted
              setSoundsMuted(next)
              setKVStore(KV_KEYS.SOUNDS_MUTED, String(next))
            }}
            active={!soundsMuted}
            activeLabel="On"
            inactiveLabel="Off"
          />
          <View className="h-3" />
          <ToggleRow
            label={ttsEnabled ? 'Character Voice On' : 'Character Voice Off'}
            description="Characters read messages aloud with unique voices"
            onToggle={() => {
              const next = !ttsEnabled
              setTtsEnabled(next)
              setKVStore(KV_KEYS.TTS_ENABLED, String(!next))
            }}
            active={ttsEnabled}
            activeLabel="On"
            inactiveLabel="Off"
          />
        </SettingSection>

        <SettingSection title="Coach Intensity">
          <Text className="text-xs text-gray-400 mb-3">How often should the Genie send proactive tips?</Text>
          <View className="flex-row gap-2">
            {(['minimal', 'moderate', 'full'] as const).map(level => (
              <Pressable
                key={level}
                className={`flex-1 py-3 rounded-card items-center border ${
                  coachIntensity === level ? 'bg-sprout-600 border-sprout-600' : 'border-gray-200'
                }`}
                onPress={() => {
                  setCoachIntensity(level)
                  setKVStore(KV_KEYS.COACH_INTENSITY, level)
                }}
              >
                <Text className={coachIntensity === level ? 'text-white font-bold text-sm capitalize' : 'text-gray-600 text-sm capitalize'}>
                  {level}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text className="text-xs text-gray-400 mt-2">
            {coachIntensity === 'minimal' && 'Rinse + harvest + risk alerts only'}
            {coachIntensity === 'moderate' && '+ Morning briefing + daily tips'}
            {coachIntensity === 'full' && '+ Real-time coaching, patterns, performance nudges'}
          </Text>
        </SettingSection>

        <SettingSection title="My Containers">
          {containerList.map(c => (
            <View key={c.id} className="flex-row items-center justify-between py-2 border-b border-gray-50">
              <View>
                <Text className="text-sm font-medium text-gray-700">{c.name}</Text>
                <Text className="text-xs text-gray-400">{c.capacityOz > 0 ? `${c.capacityOz}oz` : 'Flat tray'}</Text>
              </View>
              <Pressable
                className="px-3 py-1 rounded border border-gray-200"
                onPress={async () => {
                  await deleteContainer(c.id)
                  getAllContainers().then(setContainerList)
                }}
              >
                <Text className="text-xs text-gray-500">Remove</Text>
              </Pressable>
            </View>
          ))}
          <Text className="text-xs text-gray-400 mt-2">Add new containers when creating a batch.</Text>
        </SettingSection>

        {/* Rinse Times */}
        <SettingSection title="Default Rinse Times">
          <View className="gap-3 mb-3">
            <TimeInput label="Morning" value={rinseTime1} onChange={setRinseTime1} />
            <TimeInput label="Afternoon" value={rinseTime2} onChange={setRinseTime2} />
            <TimeInput label="Night" value={rinseTime3} onChange={setRinseTime3} />
          </View>
          <Pressable className="bg-sprout-600 py-2.5 rounded-card items-center" onPress={saveRinseTimes}>
            <Text className="text-white font-medium">Save Times</Text>
          </Pressable>
        </SettingSection>

        {/* Gemma API Key */}
        <SettingSection title="Gemma API Key">
          <Text className="text-xs text-gray-400 mb-2">Google AI Studio API key for AI features</Text>
          <View className="flex-row gap-2 mb-3">
            <TextInput
              className="flex-1 bg-gray-100 rounded-card px-4 py-2.5 text-sm"
              value={showApiKey ? apiKey : apiKey ? '••••••••' : ''}
              onChangeText={setApiKey}
              placeholder="Paste API key"
              placeholderTextColor="#999"
              secureTextEntry={!showApiKey}
              onFocus={() => setShowApiKey(true)}
              onBlur={() => setShowApiKey(false)}
            />
          </View>
          <Pressable className="bg-info-50 border border-info-200 py-2.5 rounded-card items-center" onPress={saveApiKey}>
            <Text className="text-info-600 font-medium">Save Key</Text>
          </Pressable>
        </SettingSection>

        {/* Data Export/Import */}
        <SettingSection title="Data">
          <Pressable
            className="bg-sprout-50 border border-sprout-200 py-3 rounded-card items-center mb-3"
            onPress={exportData}
          >
            <Text className="text-sprout-600 font-medium">Export All Data (JSON)</Text>
          </Pressable>
          <Pressable
            className="bg-gray-100 border border-gray-200 py-3 rounded-card items-center"
            onPress={importData}
          >
            <Text className="text-gray-600 font-medium">Import Backup</Text>
          </Pressable>
        </SettingSection>

        {/* About */}
        <SettingSection title="About">
          <Text className="text-gray-600">SproutPal v1.0.0</Text>
          <Text className="text-xs text-gray-400 mt-1">Grow better sprouts with your sprout crew.</Text>
        </SettingSection>
      </View>
    </ScrollView>
  )
}

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6 pb-6 border-b border-gray-100">
      <Text className="text-lg font-semibold text-sprout-800 mb-3">{title}</Text>
      {children}
    </View>
  )
}

function ToggleRow({
  label,
  description,
  onToggle,
  active,
  activeLabel,
  inactiveLabel,
}: {
  label: string
  description: string
  onToggle: () => void
  active: boolean
  activeLabel: string
  inactiveLabel: string
}) {
  return (
    <View className="flex-row justify-between items-center">
      <View className="flex-1 mr-4">
        <Text className="font-medium text-gray-700">{label}</Text>
        <Text className="text-xs text-gray-400">{description}</Text>
      </View>
      <Pressable
        className={`px-4 py-2 rounded-chip ${active ? 'bg-sprout-600' : 'bg-gray-300'}`}
        onPress={onToggle}
      >
        <Text className="text-white text-xs font-medium">
          {active ? activeLabel : inactiveLabel}
        </Text>
      </Pressable>
    </View>
  )
}

function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-sm text-gray-600">{label}</Text>
      <TextInput
        className="bg-gray-100 rounded-card px-4 py-2 text-sm w-24 text-center"
        value={value}
        onChangeText={onChange}
        placeholder="HH:MM"
        placeholderTextColor="#999"
      />
    </View>
  )
}
