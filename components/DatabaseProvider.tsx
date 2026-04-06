/**
 * SproutPal — Database Provider
 * Runs migrations, seeds data, and checks onboarding on app startup
 */

import { type PropsWithChildren, useEffect, useState } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
import { router } from 'expo-router'
import { db } from '@/db/client'
import migrations from '@/db/migrations/migrations'
import { seedDefaultsIfNeeded } from '@/lib/seed'
import { ensureKVTable, getKVStore, KV_KEYS } from '@/lib/kvstore'

export function DatabaseProvider({ children }: PropsWithChildren) {
  const { success, error } = useMigrations(db, migrations)
  const [seeded, setSeeded] = useState(false)
  const [seedError, setSeedError] = useState<string | null>(null)

  useEffect(() => {
    if (!success) return

    async function initData() {
      try {
        ensureKVTable()
        await seedDefaultsIfNeeded()
        setSeeded(true)

        // Check onboarding status after DB is ready
        const onboardingDone = getKVStore(KV_KEYS.ONBOARDING_COMPLETE)
        if (onboardingDone !== 'true') {
          // Small delay to let navigation mount
          setTimeout(() => {
            router.replace('/onboarding')
          }, 100)
        }
      } catch (e) {
        setSeedError(e instanceof Error ? e.message : 'Seed failed')
      }
    }

    initData()
  }, [success])

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="text-xl font-bold text-alert-600 mb-2">Database Error</Text>
        <Text className="text-gray-500 text-center">{error.message}</Text>
      </View>
    )
  }

  if (seedError) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="text-xl font-bold text-alert-600 mb-2">Setup Error</Text>
        <Text className="text-gray-500 text-center">{seedError}</Text>
      </View>
    )
  }

  if (!success || !seeded) {
    return (
      <View className="flex-1 items-center justify-center bg-sprout-50">
        <ActivityIndicator size="large" color="#3B6D11" />
        <Text className="text-sprout-600 mt-4">Setting up SproutPal...</Text>
      </View>
    )
  }

  return <>{children}</>
}
