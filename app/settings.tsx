import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native'
import { useState, useEffect } from 'react'
import { getKVStore, setKVStore, KV_KEYS } from '@/lib/kvstore'
import { db } from '@/db/client'
import { batches, characters, beanTypes, dailyLogs, seedSources, seedAdjustments, staggerPlans } from '@/db/schema'
import { getAllContainers, deleteContainer } from '@/lib/containers'
import type { containers as containersTable } from '@/db/schema'
import * as Sharing from 'expo-sharing'
import { OnDeviceAIStatus } from '@/components/OnDeviceAI'
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
    <ScrollView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ padding: 24 }}>
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
          <View style={{ height: 12 }} />
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
          <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>How often should the Genie send proactive tips?</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['minimal', 'moderate', 'full'] as const).map(level => (
              <TouchableOpacity
                key={level}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  backgroundColor: coachIntensity === level ? '#3B6D11' : 'transparent',
                  borderColor: coachIntensity === level ? '#3B6D11' : '#e5e7eb',
                }}
                onPress={() => {
                  setCoachIntensity(level)
                  setKVStore(KV_KEYS.COACH_INTENSITY, level)
                }}
              >
                <Text style={{
                  color: coachIntensity === level ? '#ffffff' : '#4b5563',
                  fontWeight: coachIntensity === level ? '700' : '400',
                  fontSize: 14,
                  textTransform: 'capitalize',
                }}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
            {coachIntensity === 'minimal' && 'Rinse + harvest + risk alerts only'}
            {coachIntensity === 'moderate' && '+ Morning briefing + daily tips'}
            {coachIntensity === 'full' && '+ Real-time coaching, patterns, performance nudges'}
          </Text>
        </SettingSection>

        <SettingSection title="My Containers">
          {containerList.map(c => (
            <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f9fafb' }}>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>{c.name}</Text>
                <Text style={{ fontSize: 12, color: '#9ca3af' }}>{c.capacityOz > 0 ? `${c.capacityOz}oz` : 'Flat tray'}</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#e5e7eb' }}
                onPress={async () => {
                  await deleteContainer(c.id)
                  getAllContainers().then(setContainerList)
                }}
              >
                <Text style={{ fontSize: 12, color: '#6b7280' }}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
          <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>Add new containers when creating a batch.</Text>
        </SettingSection>

        {/* Rinse Times */}
        <SettingSection title="Default Rinse Times">
          <View style={{ gap: 12, marginBottom: 12 }}>
            <TimeInput label="Morning" value={rinseTime1} onChange={setRinseTime1} />
            <TimeInput label="Afternoon" value={rinseTime2} onChange={setRinseTime2} />
            <TimeInput label="Night" value={rinseTime3} onChange={setRinseTime3} />
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            style={{ backgroundColor: '#3B6D11', paddingVertical: 10, borderRadius: 12, alignItems: 'center' }}
            onPress={saveRinseTimes}
          >
            <Text style={{ color: '#ffffff', fontWeight: '500' }}>Save Times</Text>
          </TouchableOpacity>
        </SettingSection>

        {/* On-Device AI */}
        <SettingSection title="On-Device AI">
          <OnDeviceAIStatus />
        </SettingSection>

        {/* Cloud AI */}
        <SettingSection title="Cloud AI (Gemini)">
          <View style={{ backgroundColor: '#E6F1FB', borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <Text style={{ fontSize: 13, color: '#185FA5', lineHeight: 20 }}>
              {'\ud83e\uddde'} The Sprout Genie uses Google's Gemini AI for personalized advice, recipes, and character-voiced tips.
            </Text>
            <Text style={{ fontSize: 12, color: '#378ADD', marginTop: 6 }}>
              Get a free key: aistudio.google.com/apikey
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>API Key</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <TextInput
              style={{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14 }}
              value={showApiKey ? apiKey : apiKey ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' : ''}
              onChangeText={setApiKey}
              placeholder="Paste your API key here"
              placeholderTextColor="#999"
              secureTextEntry={!showApiKey}
              onFocus={() => setShowApiKey(true)}
              onBlur={() => setShowApiKey(false)}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={{ flex: 1, backgroundColor: '#3B6D11', paddingVertical: 10, borderRadius: 12, alignItems: 'center' }}
              onPress={saveApiKey}
            >
              <Text style={{ color: '#ffffff', fontWeight: '500' }}>Save Key</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={{ flex: 1, backgroundColor: '#E6F1FB', borderWidth: 1, borderColor: '#85B7EB', paddingVertical: 10, borderRadius: 12, alignItems: 'center' }}
              onPress={async () => {
                if (!apiKey) { Alert.alert('No key', 'Enter an API key first.'); return }
                saveApiKey()
                try {
                  const { callGemma } = require('@/lib/gemma')
                  const result = await callGemma(
                    'You are the Sprout Genie. Respond in 1 sentence.',
                    'Say hello and confirm you are working.',
                    50,
                  )
                  if (result) {
                    Alert.alert('AI Connected!', `Genie says: "${result}"`)
                  } else {
                    Alert.alert('No response', 'Key saved but got empty response. Check the key.')
                  }
                } catch (e: any) {
                  Alert.alert('Connection failed', e?.message ?? 'Check your API key and try again.')
                }
              }}
            >
              <Text style={{ color: '#185FA5', fontWeight: '500' }}>Test Key</Text>
            </TouchableOpacity>
          </View>
          {apiKey ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 }}>
              <Text style={{ fontSize: 14 }}>{'\u2705'}</Text>
              <Text style={{ fontSize: 12, color: '#3B6D11' }}>Key saved — Genie AI is active</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 }}>
              <Text style={{ fontSize: 14 }}>{'\ud83d\udca4'}</Text>
              <Text style={{ fontSize: 12, color: '#9ca3af' }}>No key — Genie uses offline mode</Text>
            </View>
          )}
        </SettingSection>

        {/* Data Export/Import */}
        <SettingSection title="Data">
          <TouchableOpacity
            activeOpacity={0.7}
            style={{ backgroundColor: '#EAF3DE', borderWidth: 1, borderColor: '#97C459', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginBottom: 12 }}
            onPress={exportData}
          >
            <Text style={{ color: '#3B6D11', fontWeight: '500' }}>Export All Data (JSON)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            style={{ backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
            onPress={importData}
          >
            <Text style={{ color: '#4b5563', fontWeight: '500' }}>Import Backup</Text>
          </TouchableOpacity>
        </SettingSection>

        {/* About */}
        <SettingSection title="About">
          <Text style={{ color: '#4b5563' }}>SproutPal v1.0.0</Text>
          <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Grow better sprouts with your sprout crew.</Text>
        </SettingSection>
      </View>
    </ScrollView>
  )
}

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
      <Text style={{ fontSize: 18, fontWeight: '600', color: '#27500A', marginBottom: 12 }}>{title}</Text>
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
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ flex: 1, marginRight: 16 }}>
        <Text style={{ fontWeight: '500', color: '#374151' }}>{label}</Text>
        <Text style={{ fontSize: 12, color: '#9ca3af' }}>{description}</Text>
      </View>
      <TouchableOpacity
        activeOpacity={0.7}
        style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, backgroundColor: active ? '#3B6D11' : '#d1d5db' }}
        onPress={onToggle}
      >
        <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '500' }}>
          {active ? activeLabel : inactiveLabel}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: 14, color: '#4b5563' }}>{label}</Text>
      <TextInput
        style={{ backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8, fontSize: 14, width: 96, textAlign: 'center' }}
        value={value}
        onChangeText={onChange}
        placeholder="HH:MM"
        placeholderTextColor="#999"
      />
    </View>
  )
}
