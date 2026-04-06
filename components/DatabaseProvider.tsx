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
 * Inner: runs Drizzle migrations on NATIVE only.
 * Web skips migrations (useMigrations uses sync ops that break on web).
 */
function MigrationProvider({ children }: PropsWithChildren) {
  // On web, skip useMigrations entirely — it calls sync SQLite which crashes
  if (Platform.OS === 'web') {
    return <WebSeeder>{children}</WebSeeder>
  }
  return <NativeMigrator>{children}</NativeMigrator>
}

/** Native: use Drizzle's useMigrations hook (works perfectly with sync SQLite) */
function NativeMigrator({ children }: PropsWithChildren) {
  const { success, error } = useMigrations(db, migrations)
  const [seeded, setSeeded] = useState(false)

  useEffect(() => {
    if (!success) return
    async function initData() {
      try {
        ensureKVTable()
        await seedDefaultsIfNeeded()
        setSeeded(true)
        const onboardingDone = getKVStore(KV_KEYS.ONBOARDING_COMPLETE)
        if (onboardingDone !== 'true') {
          setTimeout(() => router.replace('/onboarding'), 100)
        }
      } catch (e) {
        console.error('Seed error:', e)
      }
    }
    initData()
  }, [success])

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', padding: 24 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#993C1D', marginBottom: 8 }}>Database Error</Text>
        <Text style={{ color: '#6b7280', textAlign: 'center' }}>{error.message}</Text>
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

/** Web: run raw CREATE TABLE statements (avoids the sync serialization bug) */
function WebSeeder({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        const { getRawDb } = require('@/db/client')
        const rawDb = getRawDb()
        if (rawDb) {
          // Create tables manually with execAsync (avoids sync serializer)
          await rawDb.execAsync(`
            CREATE TABLE IF NOT EXISTS bean_types (id TEXT PRIMARY KEY, name TEXT NOT NULL, emoji TEXT NOT NULL, soak_hours REAL NOT NULL, grow_days REAL NOT NULL, rinses_per_day INTEGER NOT NULL, min_temp_f INTEGER NOT NULL, max_temp_f INTEGER NOT NULL, light_preference TEXT NOT NULL, difficulty TEXT NOT NULL, notes TEXT, sulforaphane_rich INTEGER DEFAULT 0, seed_amount_grams REAL DEFAULT 20);
            CREATE TABLE IF NOT EXISTS containers (id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, capacity_oz REAL NOT NULL, notes TEXT, is_active INTEGER DEFAULT 1, created_at INTEGER NOT NULL);
            CREATE TABLE IF NOT EXISTS characters (id TEXT PRIMARY KEY, name TEXT NOT NULL, personality TEXT NOT NULL, voice_style TEXT NOT NULL, water_attitude TEXT NOT NULL, harvest_attitude TEXT NOT NULL, secret_fear TEXT NOT NULL, hidden_talent TEXT NOT NULL, catchphrase TEXT NOT NULL, rarity TEXT NOT NULL, face_color TEXT NOT NULL, eye_color TEXT NOT NULL, eye_shape TEXT NOT NULL, mouth TEXT NOT NULL, accessory_emoji TEXT NOT NULL, accessory_name TEXT NOT NULL, traits_json TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS batches (id TEXT PRIMARY KEY, bean_type_id TEXT NOT NULL, seed_source_id TEXT, character_id TEXT NOT NULL, jar_label TEXT NOT NULL, status TEXT NOT NULL, soak_start_at INTEGER NOT NULL, jar_start_at INTEGER NOT NULL, target_harvest_at INTEGER NOT NULL, actual_harvest_at INTEGER, adjusted_soak_hours REAL, adjusted_grow_days REAL, notification_ids TEXT, germination_pct REAL, user_rating INTEGER, harvest_notes TEXT, container_id TEXT, seed_amount_grams REAL, container_fill_pct REAL, harvest_yield_grams REAL, yield_ratio REAL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
            CREATE TABLE IF NOT EXISTS daily_logs (id TEXT PRIMARY KEY, batch_id TEXT NOT NULL, log_type TEXT NOT NULL, logged_at INTEGER NOT NULL, room_temp_f REAL, rinse_water_temp TEXT, observations TEXT, photo_path TEXT, growth_stage TEXT, stage_notes TEXT, gemma_analysis TEXT);
            CREATE TABLE IF NOT EXISTS kv_store (key TEXT PRIMARY KEY, value TEXT NOT NULL);
          `)
        }
        setReady(true)
        // Check onboarding
        setTimeout(() => router.replace('/onboarding'), 200)
      } catch (e) {
        console.warn('Web DB init failed, rendering anyway:', e)
        setReady(true)
      }
    }
    init()
  }, [])

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF3DE' }}>
        <ActivityIndicator size="large" color="#3B6D11" />
        <Text style={{ color: '#3B6D11', marginTop: 16 }}>Setting up SproutPal...</Text>
      </View>
    )
  }

  return <>{children}</>
}
