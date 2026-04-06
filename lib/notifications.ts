/**
 * SproutPal — Notification System
 * Scheduling, channel setup, permission handling, rescheduling
 */

import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { db } from '@/db/client'
import { batches, characters, beanTypes } from '@/db/schema'
import { eq, and, ne, or } from 'drizzle-orm'
import { getKVStore, KV_KEYS } from './kvstore'

export const CHANNEL_ID = 'sprout-reminders'

export async function setupNotificationChannel() {
  if (Platform.OS !== 'android') return

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Sprout reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#3B6D11',
    enableVibrate: true,
    showBadge: true,
  })

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
    }),
  })

  // Set up notification action categories
  await Notifications.setNotificationCategoryAsync('rinse', [
    {
      identifier: 'LOG_RINSE',
      buttonTitle: 'Log rinse \u2713',
      options: { opensAppToForeground: true },
    },
    {
      identifier: 'SNOOZE_30',
      buttonTitle: 'Snooze 30 min',
      options: { opensAppToForeground: true },
    },
  ])
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync()
  if (existing === 'granted') return true

  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

export async function scheduleRinseNotifications(
  batchId: string,
  title: string,
  body: string,
  rinseTimes: string[] = ['07:00', '15:00', '23:00'],
  harvestDate?: Date,
): Promise<string[]> {
  const scheduledIds: string[] = []

  for (const time of rinseTimes) {
    const [hour, minute] = time.split(':').map(Number)

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { batchId, type: 'rinse' },
        categoryIdentifier: 'rinse',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: CHANNEL_ID,
      },
    })
    scheduledIds.push(id)
  }

  // Schedule harvest notification if date provided
  if (harvestDate && harvestDate.getTime() > Date.now()) {
    const harvestId = await Notifications.scheduleNotificationAsync({
      content: {
        title: title.replace('needs a rinse', 'is ready to harvest!'),
        body: 'Your sprout has reached peak harvest window!',
        data: { batchId, type: 'harvest' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: harvestDate,
        channelId: CHANNEL_ID,
      },
    })
    scheduledIds.push(harvestId)
  }

  return scheduledIds
}

export async function cancelBatchNotifications(notificationIds: string[]) {
  await Promise.all(
    notificationIds.map(id => Notifications.cancelScheduledNotificationAsync(id))
  )
}

/**
 * Reschedule all active batch notifications.
 * Called on app foreground — Android may drop notifications after force-stop.
 */
export async function rescheduleAllActiveNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync()

  const activeBatches = await db.select().from(batches)
    .innerJoin(characters, eq(batches.characterId, characters.id))
    .where(and(
      ne(batches.status, 'harvested'),
      ne(batches.status, 'discarded'),
    ))

  const rinseTimes = [
    getKVStore(KV_KEYS.RINSE_TIME_1) ?? '07:00',
    getKVStore(KV_KEYS.RINSE_TIME_2) ?? '15:00',
    getKVStore(KV_KEYS.RINSE_TIME_3) ?? '23:00',
  ]

  for (const row of activeBatches) {
    const b = row.batches
    const c = row.characters
    const batchNotifIds: string[] = JSON.parse(b.notificationIds ?? '[]')
    const stillScheduled = scheduled.filter(n => batchNotifIds.includes(n.identifier))

    // If any notifications dropped, reschedule all for this batch
    if (stillScheduled.length < batchNotifIds.length) {
      // Cancel remaining stale ones
      await cancelBatchNotifications(batchNotifIds.filter(id =>
        scheduled.some(n => n.identifier === id)
      ))

      const newIds = await scheduleRinseNotifications(
        b.id,
        `${c.accessoryEmoji} ${c.name} needs a rinse!`,
        c.catchphrase,
        rinseTimes,
        new Date(b.targetHarvestAt),
      )

      await db.update(batches)
        .set({ notificationIds: JSON.stringify(newIds), updatedAt: Date.now() })
        .where(eq(batches.id, b.id))
    }
  }
}
