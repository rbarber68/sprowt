/**
 * SproutPal — Database Provider
 * Handles async DB init (web), migrations, seeding, and onboarding check
 */

import { type PropsWithChildren, useEffect, useState } from 'react'
import { View, Text, ActivityIndicator, Platform } from 'react-native'
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
import { router } from 'expo-router'
import { db, initDbAsync, getRawDb } from '@/db/client'
import migrations from '@/db/migrations/migrations'
import { seedDefaultsIfNeeded } from '@/lib/seed'
import { ensureKVTable, getKVStore, KV_KEYS, initKvDb, initKvDbNative } from '@/lib/kvstore'

/**
 * Outer wrapper: ensures the DB connection is established before rendering
 * the migration layer. On native, this is instant. On web, waits for WASM.
 */
export function DatabaseProvider({ children }: PropsWithChildren) {
  const [dbReady, setDbReady] = useState(Platform.OS !== 'web')
  const [initError, setInitError] = useState<string | null>(null)

  useEffect(() => {
    if (Platform.OS === 'web') {
      initDbAsync()
        .then(() => {
          initKvDb(getRawDb())
          setDbReady(true)
        })
        .catch(e => setInitError(e instanceof Error ? e.message : 'DB init failed'))
    } else {
      initKvDbNative()
    }
  }, [])

  if (initError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', padding: 24 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#993C1D', marginBottom: 8 }}>Setup Error</Text>
        <Text style={{ color: '#6b7280', textAlign: 'center' }}>{initError}</Text>
      </View>
    )
  }

  if (!dbReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF3DE' }}>
        <ActivityIndicator size="large" color="#3B6D11" />
        <Text style={{ color: '#3B6D11', marginTop: 16 }}>Connecting to database...</Text>
      </View>
    )
  }

  // DB is ready — now safe to run migrations
  return <MigrationProvider>{children}</MigrationProvider>
}

/**
 * Inner component: runs Drizzle migrations + seeds data.
 * Only mounts after DB connection is confirmed ready.
 */
function MigrationProvider({ children }: PropsWithChildren) {
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

        const onboardingDone = getKVStore(KV_KEYS.ONBOARDING_COMPLETE)
        if (onboardingDone !== 'true') {
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

  if (error || seedError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', padding: 24 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#993C1D', marginBottom: 8 }}>
          {seedError ? 'Setup Error' : 'Database Error'}
        </Text>
        <Text style={{ color: '#6b7280', textAlign: 'center' }}>{seedError ?? error?.message}</Text>
      </View>
    )
  }

  if (!success || !seeded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF3DE' }}>
        <ActivityIndicator size="large" color="#3B6D11" />
        <Text style={{ color: '#3B6D11', marginTop: 16 }}>Setting up SproutPal...</Text>
      </View>
    )
  }

  return <>{children}</>
}
