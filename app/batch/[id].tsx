import { View, Text, Pressable, ScrollView, Modal, Alert, TextInput } from 'react-native'
import { useLocalSearchParams, router, Stack } from 'expo-router'
import { useEffect, useState, useCallback } from 'react'
import { uuidv4 } from '@/lib/uuid'
import { db } from '@/db/client'
import { batches, characters, beanTypes, dailyLogs } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { SPROUT_TYPES } from '@/data/sproutTypes'
import { HARVEST_FAREWELLS, DISTRESS_MESSAGES, type PersonalityKey } from '@/data/characters'
import { CharacterAvatar } from '@/components/CharacterAvatar'
import { PhotoTimeline } from '@/components/PhotoTimeline'
import { RinseLogger } from '@/components/RinseLogger'
import { GemmaBubble } from '@/components/GemmaBubble'
import { GenieChat } from '@/components/GenieChat'
import { cancelBatchNotifications } from '@/lib/notifications'
import { generateRinseAnalysis, isGemmaAvailable } from '@/lib/gemma'
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
  const [harvestStep, setHarvestStep] = useState<'farewell' | 'rate'>('farewell')
  const [harvestRating, setHarvestRating] = useState(0)
  const [harvestGermination, setHarvestGermination] = useState('')
  const [harvestNotes, setHarvestNotes] = useState('')
  const [harvestWeight, setHarvestWeight] = useState('')
  const [harvestFillPct, setHarvestFillPct] = useState<number>(0)
  const [gemmaInsight, setGemmaInsight] = useState<string | null>(null)
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

  if (!batch || !character || !beanType) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-400">Loading...</Text>
      </View>
    )
  }

  const now = Date.now()
  const dayNumber = Math.max(0, Math.floor((now - batch.soakStartAt) / 86400000))
  const totalDays = Math.ceil((beanType.soakHours / 24) + beanType.growDays)
  const sproutData = SPROUT_TYPES.find(s => s.id === beanType.id)

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

    setShowHarvestModal(false)
    router.back()
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
          <Pressable style={{ marginRight: 12 }} onPress={handleRerollCharacter}>
            <Text style={{ fontSize: 18 }}>{'\ud83c\udfb2'}</Text>
          </Pressable>
        ),
      }} />

      <ScrollView className="flex-1 bg-white">
        {/* Character header */}
        <View className="items-center pt-4 pb-3 bg-sprout-50">
          <CharacterAvatar
            faceColor={character.faceColor}
            eyeColor={character.eyeColor}
            eyeShape={character.eyeShape}
            mouth={character.mouth}
            accessoryEmoji={character.accessoryEmoji}
            size={72}
            animation={batch.status === 'ready' ? 'celebrate' : 'idle'}
          />
          <Text className="text-lg font-bold text-sprout-800 mt-2">{character.name}</Text>
          <Text className="text-sm text-gray-500">
            {beanType.emoji} {beanType.name} {'\u00b7'} {batch.jarLabel}
          </Text>
          <Text className="text-xs text-gray-400 italic mt-1">"{character.catchphrase}"</Text>
        </View>

        {/* Status + progress */}
        <View className="px-4 py-3 flex-row justify-between items-center border-b border-gray-100">
          <View>
            <Text className="text-sm text-gray-500">Day {dayNumber} of {totalDays}</Text>
            <Text className="text-xs text-gray-400 capitalize">{batch.status}</Text>
          </View>
          <View className="flex-1 mx-4 h-2 bg-gray-200 rounded-full">
            <View
              className="h-2 bg-sprout-400 rounded-full"
              style={{ width: `${Math.min(dayNumber / totalDays, 1) * 100}%` }}
            />
          </View>
          <Text className="text-sm font-medium text-sprout-600">
            {Math.max(0, totalDays - dayNumber)}d left
          </Text>
        </View>

        {/* Photo timeline */}
        <View className="px-4 py-4">
          <Text className="text-lg font-bold text-sprout-800 mb-3">Photo Journal</Text>
          <PhotoTimeline
            photos={photos}
            onAddPhoto={handleAddPhoto}
          />
        </View>

        {/* Batch details */}
        <View className="px-4 py-3">
          <Text className="text-lg font-bold text-sprout-800 mb-3">Batch Details</Text>
          <View className="bg-gray-50 rounded-card p-4">
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
        <View className="px-4 py-3">
          <Text className="text-lg font-bold text-sprout-800 mb-3">Rinse Log</Text>
          {recentLogs.filter(l => l.logType === 'rinse').length === 0 ? (
            <Text className="text-gray-400 text-sm">No rinses logged yet</Text>
          ) : (
            recentLogs.filter(l => l.logType === 'rinse').slice(0, 5).map(log => (
              <View key={log.id} className="flex-row justify-between py-2 border-b border-gray-50">
                <Text className="text-sm text-gray-600">
                  {new Date(log.loggedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </Text>
                <View className="flex-row gap-2">
                  {log.roomTempF && <Text className="text-xs text-gray-500">{log.roomTempF}{'\u00b0'}F</Text>}
                  {log.rinseWaterTemp && <Text className="text-xs text-info-600">{log.rinseWaterTemp}</Text>}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Action buttons */}
        <View className="px-4 py-4 gap-3">
          {batch.status !== 'harvested' && batch.status !== 'discarded' && (
            <>
              <Pressable
                className="bg-info-50 border border-info-200 py-3 rounded-card items-center"
                onPress={() => setShowRinseLogger(true)}
              >
                <Text className="text-info-600 font-bold">Log Rinse</Text>
              </Pressable>

              <Pressable
                className="bg-sprout-600 py-4 rounded-card items-center"
                onPress={handleHarvest}
              >
                <Text className="text-white font-bold text-lg">Harvest Now</Text>
              </Pressable>

              <Pressable
                className="border border-alert-200 py-3 rounded-card items-center"
                onPress={handleDiscard}
              >
                <Text className="text-alert-600">Discard Batch</Text>
              </Pressable>
            </>
          )}
        </View>

        <View className="h-10" />
      </ScrollView>

      {/* Rinse logger bottom sheet (modal) */}
      <Modal
        visible={showRinseLogger}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRinseLogger(false)}
      >
        <View className="flex-1 bg-white pt-4">
          <View className="flex-row justify-between items-center px-4 mb-2">
            <Text className="text-lg font-bold text-sprout-800">Log Rinse</Text>
            <Pressable onPress={() => setShowRinseLogger(false)}>
              <Text className="text-2xl text-gray-400">{'\u2715'}</Text>
            </Pressable>
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
          <View className="flex-1 bg-sprout-50 items-center justify-center p-8">
            <CharacterAvatar
              faceColor={character.faceColor}
              eyeColor={character.eyeColor}
              eyeShape={character.eyeShape}
              mouth={character.mouth}
              accessoryEmoji={character.accessoryEmoji}
              size={120}
              animation="celebrate"
            />
            <Text className="text-2xl font-bold text-sprout-800 mt-6 text-center">
              {farewell?.title ?? 'Harvest time!'}
            </Text>
            <Text className="text-base text-gray-600 mt-4 text-center leading-6">
              {farewell?.body ?? 'Your sprout is ready to harvest.'}
            </Text>
            <Pressable
              className="bg-sprout-600 px-8 py-4 rounded-card mt-8"
              onPress={() => setHarvestStep('rate')}
            >
              <Text className="text-white font-bold text-lg">
                {farewell?.cta ?? 'Harvest'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView className="flex-1 bg-white" contentContainerClassName="p-6">
            <Text className="text-2xl font-bold text-sprout-800 mb-6">Rate this batch</Text>

            {/* Star rating */}
            <Text className="text-sm font-medium text-gray-500 mb-2">How was it? (1-5)</Text>
            <View className="flex-row gap-2 mb-4">
              {[1, 2, 3, 4, 5].map(star => (
                <Pressable key={star} onPress={() => setHarvestRating(star)}>
                  <Text className="text-3xl">
                    {star <= harvestRating ? '\u2605' : '\u2606'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Germination % */}
            <Text className="text-sm font-medium text-gray-500 mb-2">Germination % (optional)</Text>
            <TextInput
              className="bg-gray-100 rounded-card px-4 py-3 text-base mb-4"
              value={harvestGermination}
              onChangeText={setHarvestGermination}
              placeholder="e.g., 95"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />

            {/* Notes */}
            <Text className="text-sm font-medium text-gray-500 mb-2">Notes (optional)</Text>
            <TextInput
              className="bg-gray-100 rounded-card px-4 py-3 text-base mb-6"
              value={harvestNotes}
              onChangeText={setHarvestNotes}
              placeholder="How did this batch turn out?"
              multiline
              numberOfLines={3}
              placeholderTextColor="#999"
            />

            {/* Harvest weight */}
            <Text className="text-sm font-medium text-gray-500 mb-2">Harvest weight (grams)</Text>
            <TextInput
              className="bg-gray-100 rounded-card px-4 py-3 text-base mb-4"
              value={harvestWeight}
              onChangeText={setHarvestWeight}
              placeholder="e.g., 130"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />

            {/* Container fill % */}
            <Text className="text-sm font-medium text-gray-500 mb-2">How full was the container?</Text>
            <View className="flex-row gap-2 mb-4">
              {[25, 50, 75, 100].map(pct => (
                <Pressable
                  key={pct}
                  className={`flex-1 py-2 rounded-chip border items-center ${
                    harvestFillPct === pct ? 'bg-sprout-200 border-sprout-400' : 'border-gray-200'
                  }`}
                  onPress={() => setHarvestFillPct(pct)}
                >
                  <Text className={harvestFillPct === pct ? 'text-sprout-800 text-sm font-medium' : 'text-gray-600 text-sm'}>
                    {pct}%
                  </Text>
                </Pressable>
              ))}
              <Pressable
                className={`flex-1 py-2 rounded-chip border items-center ${
                  harvestFillPct === 110 ? 'bg-soak-100 border-soak-400' : 'border-gray-200'
                }`}
                onPress={() => setHarvestFillPct(110)}
              >
                <Text className="text-sm">{'\ud83d\udca5'}</Text>
              </Pressable>
            </View>

            {/* Yield ratio preview */}
            {harvestWeight && batch.seedAmountGrams && batch.seedAmountGrams > 0 && (
              <View className="bg-sprout-50 rounded-card p-3 mb-4">
                <Text className="text-sm text-sprout-600 font-medium">
                  Yield: {(parseFloat(harvestWeight) / batch.seedAmountGrams).toFixed(1)}x from {batch.seedAmountGrams}g seed
                </Text>
              </View>
            )}

            <Pressable
              className="bg-sprout-600 py-4 rounded-card items-center"
              onPress={confirmHarvest}
            >
              <Text className="text-white font-bold text-lg">Complete Harvest</Text>
            </Pressable>
          </ScrollView>
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
        <View className="flex-1 bg-black">
          <CameraView
            ref={cameraRef}
            className="flex-1"
            facing="back"
          >
            <View className="flex-1 justify-end items-center pb-10">
              <View className="flex-row items-center gap-6">
                <Pressable
                  className="bg-white/30 px-6 py-3 rounded-card"
                  onPress={() => setShowCamera(false)}
                >
                  <Text className="text-white font-medium">Cancel</Text>
                </Pressable>
                <Pressable
                  className="w-20 h-20 rounded-full bg-white border-4 border-sprout-400 items-center justify-center"
                  onPress={takePicture}
                >
                  <View className="w-16 h-16 rounded-full bg-sprout-400" />
                </Pressable>
                <View className="w-20" />
              </View>
            </View>
          </CameraView>
        </View>
      </Modal>
    </>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1.5 border-b border-gray-100">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="text-sm text-sprout-800">{value}</Text>
    </View>
  )
}
