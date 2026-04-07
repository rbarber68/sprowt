import { View, Text, TouchableOpacity, ScrollView, Modal, Alert, TextInput } from 'react-native'
import { useLocalSearchParams, router, Stack } from 'expo-router'
import { useEffect, useState, useCallback } from 'react'
import { uuidv4 } from '@/lib/uuid'
import { db } from '@/db/client'
import { batches, characters, beanTypes, dailyLogs } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { SPROUT_TYPES } from '@/data/sproutTypes'
import { HARVEST_FAREWELLS, DISTRESS_MESSAGES, PERSONALITIES, type PersonalityKey } from '@/data/characters'
import { CharacterAvatar } from '@/components/CharacterAvatar'
import { PhotoTimeline } from '@/components/PhotoTimeline'
import { RinseLogger } from '@/components/RinseLogger'
import { GemmaBubble } from '@/components/GemmaBubble'
import { GenieChat } from '@/components/GenieChat'
import { cancelBatchNotifications } from '@/lib/notifications'
import { generateRinseAnalysis, generateHarvestCelebration, isGemmaAvailable } from '@/lib/gemma'
import { HarvestCelebration } from '@/components/HarvestCelebration'
import { playSound } from '@/lib/sounds'
import { markRinseDay } from '@/lib/achievements'
import { generateCharacter } from '@/data/characters'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { Paths, File as ExpoFile, Directory } from 'expo-file-system/next'
import { useRef } from 'react'

export default function BatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [batch, setBatch] = useState<typeof batches.$inferSelect | null>(null)
  const [character, setCharacter] = useState<typeof characters.$inferSelect | null>(null)
  const [beanType, setBeanType] = useState<typeof beanTypes.$inferSelect | null>(null)
  const [recentLogs, setRecentLogs] = useState<(typeof dailyLogs.$inferSelect)[]>([])
  const [showRinseLogger, setShowRinseLogger] = useState(false)
  const [showHarvestModal, setShowHarvestModal] = useState(false)
  const [harvestStep, setHarvestStep] = useState<'farewell' | 'rate' | 'celebrate'>('farewell')
  const [harvestRating, setHarvestRating] = useState(0)
  const [harvestGermination, setHarvestGermination] = useState('')
  const [harvestNotes, setHarvestNotes] = useState('')
  const [harvestWeight, setHarvestWeight] = useState('')
  const [harvestFillPct, setHarvestFillPct] = useState<number>(0)
  const [gemmaInsight, setGemmaInsight] = useState<string | null>(null)
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null)
  const [gemmaLoading, setGemmaLoading] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [showGenie, setShowGenie] = useState(false)
  const [cameraStage, setCameraStage] = useState<string>('soaking')
  const [photos, setPhotos] = useState<Record<string, string | null>>({})
  const [permission, requestPermission] = useCameraPermissions()
  const cameraRef = useRef<CameraView>(null)

  const loadBatch = useCallback(async () => {
    if (!id) return
    const [row] = await db.select().from(batches)
      .innerJoin(characters, eq(batches.characterId, characters.id))
      .innerJoin(beanTypes, eq(batches.beanTypeId, beanTypes.id))
      .where(eq(batches.id, id))

    if (row) {
      setBatch(row.batches)
      setCharacter(row.characters)
      setBeanType(row.bean_types)
    }

    // Load recent logs
    const logs = await db.select().from(dailyLogs)
      .where(eq(dailyLogs.batchId, id))
      .orderBy(desc(dailyLogs.loggedAt))
      .limit(20)
    setRecentLogs(logs)

    // Build photos map from photo logs
    const photoMap: Record<string, string | null> = {}
    for (const log of logs) {
      if (log.logType === 'photo' && log.growthStage && log.photoPath) {
        if (!photoMap[log.growthStage]) {
          photoMap[log.growthStage] = log.photoPath
        }
      }
    }
    setPhotos(photoMap)
  }, [id])

  useEffect(() => { loadBatch() }, [loadBatch])

  const handleAddPhoto = async (stage: string) => {
    setCameraStage(stage)
    if (!permission?.granted) {
      const result = await requestPermission()
      if (!result.granted) {
        Alert.alert('Camera permission needed', 'Enable camera access in settings to take sprout photos.')
        return
      }
    }
    setShowCamera(true)
  }

  const takePicture = async () => {
    if (!cameraRef.current || !batch) return
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 })
      if (!photo) return

      // Move photo to app's persistent storage
      const photosDir = new Directory(Paths.document, 'photos')
      if (!photosDir.exists) photosDir.create()

      const fileName = `${batch.id}_${cameraStage}_${Date.now()}.jpg`
      const destFile = new ExpoFile(photosDir, fileName)
      const srcFile = new ExpoFile(photo.uri)
      srcFile.move(destFile)

      const savedUri = destFile.uri

      // Save to daily_logs
      await db.insert(dailyLogs).values({
        id: uuidv4(),
        batchId: batch.id,
        logType: 'photo',
        loggedAt: Date.now(),
        photoPath: savedUri,
        growthStage: cameraStage,
      })

      setPhotos(prev => ({ ...prev, [cameraStage]: savedUri }))
      setShowCamera(false)
      loadBatch()
    } catch (e) {
      console.error('Failed to take picture:', e)
      Alert.alert('Error', 'Failed to capture photo.')
    }
  }

  // Soak timer state — hooks MUST be called before any early return
  const [soakCountdown, setSoakCountdown] = useState('')
  const [showDrainReveal, setShowDrainReveal] = useState(false)

  useEffect(() => {
    if (!batch || batch.status !== 'soaking') return
    const soakEnd = batch.jarStartAt
    const update = () => {
      const remaining = Math.max(0, soakEnd - Date.now())
      if (remaining <= 0) {
        setSoakCountdown('DONE!')
        return
      }
      const hrs = Math.floor(remaining / 3600000)
      const mins = Math.floor((remaining % 3600000) / 60000)
      const secs = Math.floor((remaining % 60000) / 1000)
      setSoakCountdown(hrs > 0 ? `${hrs}h ${mins}m ${secs}s` : mins > 0 ? `${mins}m ${secs}s` : `${secs}s`)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [batch?.status, batch?.jarStartAt])

  if (!batch || !character || !beanType) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#9ca3af' }}>Loading...</Text>
      </View>
    )
  }

  const now = Date.now()
  const dayNumber = Math.max(0, Math.floor((now - batch.soakStartAt) / 86400000))
  const totalDays = Math.ceil((beanType.soakHours / 24) + beanType.growDays)
  const sproutData = SPROUT_TYPES.find(s => s.id === beanType.id)

  // Soak computed values
  const soakEndTime = batch.jarStartAt
  const soakTotalMs = (beanType.soakHours * 3600000)
  const soakElapsedMs = now - batch.soakStartAt
  const soakRemainingMs = Math.max(0, soakEndTime - now)
  const soakProgress = Math.min(soakElapsedMs / soakTotalMs, 1)
  const soakDone = soakRemainingMs <= 0

  const handleDrainToJar = async () => {
    try {
      playSound('dice-roll').catch(() => {})
      // Update DB first, then show reveal
      await db.update(batches)
        .set({ status: 'growing', jarStartAt: Date.now(), updatedAt: Date.now() })
        .where(eq(batches.id, batch.id))
      setShowDrainReveal(true)
      setTimeout(() => { playSound('tada').catch(() => {}) }, 600)
    } catch (e) {
      console.error('Drain failed:', e)
      // Still show reveal even if DB update fails
      setShowDrainReveal(true)
    }
  }

  const handleRevealDismiss = () => {
    setShowDrainReveal(false)
    playSound('water-splash')
    loadBatch()
  }

  const handleRinseLog = async (data: {
    roomTempF?: number
    rinseWaterTemp?: string
    observations: string[]
  }) => {
    const logId = uuidv4()
    await db.insert(dailyLogs).values({
      id: logId,
      batchId: batch.id,
      logType: 'rinse',
      loggedAt: Date.now(),
      roomTempF: data.roomTempF ?? null,
      rinseWaterTemp: data.rinseWaterTemp ?? null,
      observations: data.observations.length > 0 ? JSON.stringify(data.observations) : null,
    })
    playSound('water-splash')
    markRinseDay() // Track for streak achievements
    setShowRinseLogger(false)
    loadBatch()

    // Generate Gemma analysis if observations logged and API available
    if (data.observations.length > 0 && isGemmaAvailable() && character && beanType) {
      setGemmaLoading(true)
      try {
        const sproutData = SPROUT_TYPES.find(s => s.id === beanType.id)
        const stage = batch.status === 'soaking' ? 'soaking' : 'growing'
        const analysis = await generateRinseAnalysis(
          character as any,
          { name: beanType.name, gemmaContext: sproutData?.gemmaContext ?? '' },
          stage,
          data.observations,
          data.roomTempF,
        )
        setGemmaInsight(analysis)
        // Cache in the daily log
        await db.update(dailyLogs)
          .set({ gemmaAnalysis: analysis })
          .where(eq(dailyLogs.id, logId))
      } finally {
        setGemmaLoading(false)
      }
    }
  }

  const handleHarvest = async () => {
    setShowHarvestModal(true)
  }

  const confirmHarvest = async () => {
    if (batch.notificationIds) {
      const ids: string[] = JSON.parse(batch.notificationIds)
      await cancelBatchNotifications(ids)
    }

    const germPct = harvestGermination ? parseFloat(harvestGermination) : null
    const yieldGrams = harvestWeight ? parseFloat(harvestWeight) : null
    const seedGrams = batch.seedAmountGrams ?? 0
    const yieldRatio = (yieldGrams && seedGrams > 0) ? yieldGrams / seedGrams : null

    await db.update(batches)
      .set({
        status: 'harvested',
        actualHarvestAt: Date.now(),
        germinationPct: germPct,
        userRating: harvestRating > 0 ? harvestRating : null,
        harvestNotes: harvestNotes || null,
        harvestYieldGrams: yieldGrams,
        containerFillPct: harvestFillPct > 0 ? harvestFillPct : null,
        yieldRatio: yieldRatio,
        updatedAt: Date.now(),
      })
      .where(eq(batches.id, batch.id))

    // Generate celebration message in background
    if (isGemmaAvailable() && character && beanType) {
      const sproutData = SPROUT_TYPES.find(s => s.id === beanType.id)
      const { getRecipesForSprout } = require('@/data/recipes')
      const recipes = getRecipesForSprout(beanType.id)
      generateHarvestCelebration(
        character as any,
        { name: beanType.name, gemmaContext: sproutData?.gemmaContext ?? '' },
        yieldRatio,
        yieldGrams,
        harvestRating > 0 ? harvestRating : null,
        recipes.map((r: any) => r.title),
      ).then(setCelebrationMessage)
    }

    playSound('celebration-fanfare')
    setHarvestStep('celebrate')
  }

  const handleDiscard = () => {
    Alert.alert(
      'Discard batch?',
      'This batch will be archived as discarded. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            if (batch.notificationIds) {
              const ids: string[] = JSON.parse(batch.notificationIds)
              await cancelBatchNotifications(ids)
            }
            await db.update(batches)
              .set({ status: 'discarded', updatedAt: Date.now() })
              .where(eq(batches.id, batch.id))
            router.back()
          },
        },
      ]
    )
  }

  const handleRerollCharacter = () => {
    if (!batch || !beanType) return
    Alert.alert(
      'Re-roll character?',
      'This will replace the current character with a new random one. Batch data is kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Re-roll',
          onPress: async () => {
            const newTraits = generateCharacter(beanType.id)
            const newId = uuidv4()
            await db.insert(characters).values({
              id: newId,
              name: newTraits.name,
              personality: newTraits.personality,
              voiceStyle: newTraits.voiceStyle,
              waterAttitude: newTraits.waterAttitude,
              harvestAttitude: newTraits.harvestAttitude,
              secretFear: newTraits.secretFear,
              hiddenTalent: newTraits.hiddenTalent,
              catchphrase: newTraits.catchphrase,
              rarity: newTraits.rarity,
              faceColor: newTraits.faceColor,
              eyeColor: newTraits.eyeColor,
              eyeShape: newTraits.eyeShape,
              mouth: newTraits.mouth,
              accessoryEmoji: newTraits.accessoryEmoji,
              accessoryName: newTraits.accessoryName,
              traitsJson: JSON.stringify(newTraits),
            })
            await db.update(batches)
              .set({ characterId: newId, updatedAt: Date.now() })
              .where(eq(batches.id, batch.id))
            loadBatch()
          },
        },
      ]
    )
  }

  const farewell = HARVEST_FAREWELLS[character.personality as PersonalityKey]

  return (
    <>
      <Stack.Screen options={{
        title: `${character.name}`,
        headerRight: () => (
          <TouchableOpacity activeOpacity={0.7} style={{ marginRight: 12 }} onPress={handleRerollCharacter}>
            <Text style={{ fontSize: 18 }}>{'\ud83c\udfb2'}</Text>
          </TouchableOpacity>
        ),
      }} />

      <ScrollView style={{ flex: 1, backgroundColor: '#ffffff' }}>
        {/* Character header */}
        <View style={{ alignItems: 'center', paddingTop: 16, paddingBottom: 12, backgroundColor: batch.status === 'soaking' ? '#FAEEDA' : '#EAF3DE' }}>
          {batch.status === 'soaking' ? (
            <>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#EF9F27', opacity: 0.3, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 32 }}>{'\ud83d\udca7'}</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#854F0B', marginTop: 8 }}>??? Soaking ???</Text>
              <Text style={{ fontSize: 14, color: '#BA7517' }}>
                {beanType.emoji} {beanType.name} {'\u00b7'} {batch.jarLabel}
              </Text>
              <Text style={{ fontSize: 12, color: '#BA7517', fontStyle: 'italic', marginTop: 4 }}>A personality is forming in the water...</Text>
            </>
          ) : (
            <>
              <CharacterAvatar
                faceColor={character.faceColor}
                eyeColor={character.eyeColor}
                eyeShape={character.eyeShape}
                mouth={character.mouth}
                accessoryEmoji={character.accessoryEmoji}
                size={72}
                animation={batch.status === 'ready' ? 'celebrate' : 'idle'}
              />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#27500A', marginTop: 8 }}>{character.name}</Text>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>
                {beanType.emoji} {beanType.name} {'\u00b7'} {batch.jarLabel}
              </Text>
              <Text style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic', marginTop: 4 }}>"{character.catchphrase}"</Text>
            </>
          )}
        </View>

        {/* Status + progress */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
          <View>
            <Text style={{ fontSize: 14, color: '#6b7280' }}>Day {dayNumber} of {totalDays}</Text>
            <Text style={{ fontSize: 12, color: '#9ca3af', textTransform: 'capitalize' }}>{batch.status}</Text>
          </View>
          <View style={{ flex: 1, marginHorizontal: 16, height: 8, backgroundColor: '#e5e7eb', borderRadius: 9999 }}>
            <View
              style={{ height: 8, backgroundColor: '#639922', borderRadius: 9999, width: `${Math.min(dayNumber / totalDays, 1) * 100}%` }}
            />
          </View>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#3B6D11' }}>
            {Math.max(0, totalDays - dayNumber)}d left
          </Text>
        </View>

        {/* Soak Timer — only shown when soaking */}
        {batch.status === 'soaking' && (
          <View style={{ marginHorizontal: 16, marginTop: 16, backgroundColor: '#FAEEDA', borderWidth: 2, borderColor: '#EF9F27', borderRadius: 16, padding: 20 }}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: '#854F0B', fontWeight: '600', marginBottom: 4 }}>
                {'\ud83d\udca7'} Soaking in Progress
              </Text>
              <Text style={{ fontSize: 11, color: '#BA7517', marginBottom: 8 }}>
                {'\u2728'} {character.name} is developing their personality...
              </Text>
              <Text style={{ fontSize: 42, fontWeight: 'bold', color: '#633806', fontVariant: ['tabular-nums'] }}>
                {soakCountdown}
              </Text>
              <Text style={{ fontSize: 12, color: '#BA7517', marginTop: 4 }}>
                {beanType.soakHours}h soak {'\u00b7'} {beanType.name}
              </Text>
            </View>

            {/* Soak progress bar */}
            <View style={{ height: 10, backgroundColor: '#FAC775', borderRadius: 5, marginBottom: 16 }}>
              <View style={{ height: 10, backgroundColor: '#EF9F27', borderRadius: 5, width: `${soakProgress * 100}%` }} />
            </View>

            {/* Info tips */}
            <View style={{ backgroundColor: '#fff8e8', borderRadius: 10, padding: 12, marginBottom: 16 }}>
              <Text style={{ fontSize: 12, color: '#854F0B', lineHeight: 18 }}>
                {'\ud83d\udca1'} {beanType.name} needs {beanType.soakHours} hours of soaking. Keep seeds fully submerged in cool water. Drain and rinse when the timer ends.
              </Text>
            </View>

            {/* Drain button — enabled when soak is done or user wants to drain early */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleDrainToJar}
              style={{
                backgroundColor: soakDone ? '#3B6D11' : '#BA7517',
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                {soakDone ? '\ud83e\udeb4 Drain & Move to Jar!' : '\u23ed\ufe0f Drain Early (Skip Remaining Soak)'}
              </Text>
            </TouchableOpacity>

            {soakDone && (
              <View style={{ alignItems: 'center', marginTop: 12 }}>
                <Text style={{ fontSize: 24 }}>{'\ud83c\udf89'}</Text>
                <Text style={{ color: '#3B6D11', fontWeight: '600', fontSize: 14 }}>Soak complete! Time to drain and start growing!</Text>
              </View>
            )}
          </View>
        )}

        {/* Photo timeline */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#27500A', marginBottom: 12 }}>Photo Journal</Text>
          <PhotoTimeline
            photos={photos}
            onAddPhoto={handleAddPhoto}
          />
        </View>

        {/* Batch details */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#27500A', marginBottom: 12 }}>Batch Details</Text>
          <View style={{ backgroundColor: '#f9fafb', borderRadius: 12, padding: 16 }}>
            <DetailRow label="Bean type" value={`${beanType.emoji} ${beanType.name}`} />
            <DetailRow label="Jar label" value={batch.jarLabel} />
            <DetailRow label="Soak started" value={new Date(batch.soakStartAt).toLocaleString()} />
            <DetailRow label="Jar started" value={new Date(batch.jarStartAt).toLocaleString()} />
            <DetailRow label="Target harvest" value={new Date(batch.targetHarvestAt).toLocaleDateString()} />
            <DetailRow label="Temp range" value={`${beanType.minTempF}\u2013${beanType.maxTempF}\u00b0F`} />
            <DetailRow label="Rinses/day" value={`${beanType.rinsesPerDay}x`} />
          </View>
        </View>

        {/* Gemma insight */}
        <GemmaBubble
          characterName={character.name}
          characterEmoji={character.accessoryEmoji}
          message={gemmaInsight ?? character.catchphrase}
          isLoading={gemmaLoading}
          onPress={() => setShowGenie(true)}
        />

        {/* Recent rinse log */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#27500A', marginBottom: 12 }}>Rinse Log</Text>
          {recentLogs.filter(l => l.logType === 'rinse').length === 0 ? (
            <Text style={{ color: '#9ca3af', fontSize: 14 }}>No rinses logged yet</Text>
          ) : (
            recentLogs.filter(l => l.logType === 'rinse').slice(0, 5).map(log => (
              <View key={log.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f9fafb' }}>
                <Text style={{ fontSize: 14, color: '#4b5563' }}>
                  {new Date(log.loggedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {log.roomTempF && <Text style={{ fontSize: 12, color: '#6b7280' }}>{log.roomTempF}{'\u00b0'}F</Text>}
                  {log.rinseWaterTemp && <Text style={{ fontSize: 12, color: '#185FA5' }}>{log.rinseWaterTemp}</Text>}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Action buttons */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 16, gap: 12 }}>
          {batch.status !== 'harvested' && batch.status !== 'discarded' && (
            <>
              <TouchableOpacity
                activeOpacity={0.7}
                style={{ backgroundColor: '#E6F1FB', borderWidth: 1, borderColor: '#85B7EB', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
                onPress={() => setShowRinseLogger(true)}
              >
                <Text style={{ color: '#185FA5', fontWeight: 'bold' }}>Log Rinse</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={{ backgroundColor: '#3B6D11', paddingVertical: 16, borderRadius: 12, alignItems: 'center' }}
                onPress={handleHarvest}
              >
                <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 18 }}>Harvest Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={{ borderWidth: 1, borderColor: '#F0997B', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
                onPress={handleDiscard}
              >
                <Text style={{ color: '#993C1D' }}>Discard Batch</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Rinse logger bottom sheet (modal) */}
      <Modal
        visible={showRinseLogger}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRinseLogger(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#ffffff', paddingTop: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#27500A' }}>Log Rinse</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setShowRinseLogger(false)}>
              <Text style={{ fontSize: 24, color: '#9ca3af' }}>{'\u2715'}</Text>
            </TouchableOpacity>
          </View>
          <RinseLogger onSubmit={handleRinseLog} />
        </View>
      </Modal>

      {/* Harvest farewell modal */}
      <Modal
        visible={showHarvestModal}
        animationType="fade"
        onRequestClose={() => { setShowHarvestModal(false); setHarvestStep('farewell') }}
      >
        {harvestStep === 'farewell' ? (
          <View style={{ flex: 1, backgroundColor: '#EAF3DE', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <CharacterAvatar
              faceColor={character.faceColor}
              eyeColor={character.eyeColor}
              eyeShape={character.eyeShape}
              mouth={character.mouth}
              accessoryEmoji={character.accessoryEmoji}
              size={120}
              animation="celebrate"
            />
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#27500A', marginTop: 24, textAlign: 'center' }}>
              {farewell?.title ?? 'Harvest time!'}
            </Text>
            <Text style={{ fontSize: 16, color: '#4b5563', marginTop: 16, textAlign: 'center', lineHeight: 24 }}>
              {farewell?.body ?? 'Your sprout is ready to harvest.'}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={{ backgroundColor: '#3B6D11', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12, marginTop: 32 }}
              onPress={() => setHarvestStep('rate')}
            >
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 18 }}>
                {farewell?.cta ?? 'Harvest'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={{ flex: 1, backgroundColor: '#ffffff' }} contentContainerStyle={{ padding: 24 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#27500A', marginBottom: 24 }}>Rate this batch</Text>

            {/* Star rating */}
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#6b7280', marginBottom: 8 }}>How was it? (1-5)</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity activeOpacity={0.7} key={star} onPress={() => setHarvestRating(star)}>
                  <Text style={{ fontSize: 30 }}>
                    {star <= harvestRating ? '\u2605' : '\u2606'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Germination % */}
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#6b7280', marginBottom: 8 }}>Germination % (optional)</Text>
            <TextInput
              style={{ backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 16 }}
              value={harvestGermination}
              onChangeText={setHarvestGermination}
              placeholder="e.g., 95"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />

            {/* Notes */}
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#6b7280', marginBottom: 8 }}>Notes (optional)</Text>
            <TextInput
              style={{ backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 24 }}
              value={harvestNotes}
              onChangeText={setHarvestNotes}
              placeholder="How did this batch turn out?"
              multiline
              numberOfLines={3}
              placeholderTextColor="#999"
            />

            {/* Harvest weight */}
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#6b7280', marginBottom: 8 }}>Harvest weight (grams)</Text>
            <TextInput
              style={{ backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 16 }}
              value={harvestWeight}
              onChangeText={setHarvestWeight}
              placeholder="e.g., 130"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />

            {/* Container fill % */}
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#6b7280', marginBottom: 8 }}>How full was the container?</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {[25, 50, 75, 100].map(pct => (
                <TouchableOpacity
                  activeOpacity={0.7}
                  key={pct}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1,
                    alignItems: 'center',
                    backgroundColor: harvestFillPct === pct ? '#97C459' : 'transparent',
                    borderColor: harvestFillPct === pct ? '#639922' : '#e5e7eb',
                  }}
                  onPress={() => setHarvestFillPct(pct)}
                >
                  <Text style={{ fontSize: 14, fontWeight: harvestFillPct === pct ? '500' : '400', color: harvestFillPct === pct ? '#27500A' : '#4b5563' }}>
                    {pct}%
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  alignItems: 'center',
                  backgroundColor: harvestFillPct === 110 ? '#FAC775' : 'transparent',
                  borderColor: harvestFillPct === 110 ? '#FAC775' : '#e5e7eb',
                }}
                onPress={() => setHarvestFillPct(110)}
              >
                <Text style={{ fontSize: 14 }}>{'\ud83d\udca5'}</Text>
              </TouchableOpacity>
            </View>

            {/* Yield ratio preview */}
            {harvestWeight && batch.seedAmountGrams && batch.seedAmountGrams > 0 && (
              <View style={{ backgroundColor: '#EAF3DE', borderRadius: 12, padding: 12, marginBottom: 16 }}>
                <Text style={{ fontSize: 14, color: '#3B6D11', fontWeight: '500' }}>
                  Yield: {(parseFloat(harvestWeight) / batch.seedAmountGrams).toFixed(1)}x from {batch.seedAmountGrams}g seed
                </Text>
              </View>
            )}

            <TouchableOpacity
              activeOpacity={0.7}
              style={{ backgroundColor: '#3B6D11', paddingVertical: 16, borderRadius: 12, alignItems: 'center' }}
              onPress={confirmHarvest}
            >
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 18 }}>Complete Harvest</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {harvestStep === 'celebrate' && character && beanType && (
          <HarvestCelebration
            character={character as any}
            beanTypeId={beanType.id}
            yieldRatio={batch.yieldRatio ?? null}
            harvestYieldGrams={batch.harvestYieldGrams ?? null}
            seedAmountGrams={batch.seedAmountGrams ?? null}
            userRating={harvestRating > 0 ? harvestRating : null}
            gemmaMessage={celebrationMessage}
            onDone={() => { setShowHarvestModal(false); router.back() }}
            onStartNewBatch={() => { setShowHarvestModal(false); router.replace('/batch/new') }}
          />
        )}
      </Modal>

      <GenieChat
        visible={showGenie}
        onClose={() => setShowGenie(false)}
        screenContext={{ screen: 'batch', batchId: id }}
      />

      {/* Camera modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={() => setShowCamera(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#000000' }}>
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing="back"
          >
            <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{ backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
                  onPress={() => setShowCamera(false)}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '500' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#ffffff', borderWidth: 4, borderColor: '#639922', alignItems: 'center', justifyContent: 'center' }}
                  onPress={takePicture}
                >
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#639922' }} />
                </TouchableOpacity>
                <View style={{ width: 80 }} />
              </View>
            </View>
          </CameraView>
        </View>
      </Modal>

      {/* Character Reveal on Drain — "Born from the soak" */}
      <Modal
        visible={showDrainReveal}
        animationType="fade"
        onRequestClose={handleRevealDismiss}
      >
        <View style={{ flex: 1, backgroundColor: '#173404', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 14, color: '#639922', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
            A new contestant emerges...
          </Text>
          <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 24, textAlign: 'center' }}>
            Born from the Soak! {'\ud83c\udf1f'}
          </Text>

          <View style={{
            width: 160, height: 160, borderRadius: 80,
            backgroundColor: character.faceColor + '30',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 3, borderColor: '#97C459',
            shadowColor: '#97C459', shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5, shadowRadius: 24, elevation: 12,
          }}>
            <CharacterAvatar
              faceColor={character.faceColor}
              eyeColor={character.eyeColor}
              eyeShape={character.eyeShape}
              mouth={character.mouth}
              accessoryEmoji={character.accessoryEmoji}
              size={110}
              animation="reveal"
            />
          </View>

          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 20 }}>
            {character.name}
          </Text>
          <Text style={{ fontSize: 15, color: '#97C459', marginTop: 4 }}>
            {PERSONALITIES[character.personality as PersonalityKey]?.label}
          </Text>
          <Text style={{ fontSize: 14, color: '#C0DD97', fontStyle: 'italic', marginTop: 12, textAlign: 'center', lineHeight: 22 }}>
            "{character.catchphrase}"
          </Text>

          <View style={{ backgroundColor: '#27500A', borderRadius: 14, padding: 16, marginTop: 20, width: '100%' }}>
            <Text style={{ color: '#639922', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              {'\ud83e\udeb4'} Moving to jar
            </Text>
            <Text style={{ color: '#C0DD97', fontSize: 14, lineHeight: 20 }}>
              Soak complete! {character.name} is now draining into {batch.jarLabel}. The growing phase begins!
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleRevealDismiss}
            style={{ backgroundColor: '#97C459', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 24, width: '100%',
              shadowColor: '#97C459', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }}
          >
            <Text style={{ color: '#173404', fontWeight: 'bold', fontSize: 18 }}>Let's Grow! {'\ud83c\udf31'}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
      <Text style={{ fontSize: 14, color: '#6b7280' }}>{label}</Text>
      <Text style={{ fontSize: 14, color: '#27500A' }}>{value}</Text>
    </View>
  )
}
