import { Platform, LogBox } from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'

// Suppress expo-sqlite web serialization errors (non-critical on web)
if (Platform.OS === 'web') {
  LogBox.ignoreAllLogs(true)
  // Suppress error overlay for known web SQLite issues
  const origConsoleError = console.error
  console.error = (...args: any[]) => {
    const msg = String(args[0])
    if (msg.includes('Unterminated string') || msg.includes('Sync operation timeout')) return
    origConsoleError(...args)
  }
  // Suppress the dev error overlay for these known errors
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (e) => {
      if (e.message?.includes('Unterminated string') || e.message?.includes('Sync operation')) {
        e.preventDefault()
        e.stopPropagation()
        return true
      }
    })
    window.addEventListener('unhandledrejection', (e) => {
      const msg = String(e.reason)
      if (msg.includes('Unterminated string') || msg.includes('Sync operation')) {
        e.preventDefault()
      }
    })
  }
}
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { Stack, router } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import * as Notifications from 'expo-notifications'
import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import 'react-native-reanimated'

import '../global.css'
import { useColorScheme } from '@/components/useColorScheme'
import { DatabaseProvider } from '@/components/DatabaseProvider'
import { setupNotificationChannel, rescheduleAllActiveNotifications } from '@/lib/notifications'
import { preloadSounds, playSound } from '@/lib/sounds'
import { checkBatchStatuses } from '@/lib/batchStatus'

// On web, use a lenient error boundary that doesn't block rendering for DB errors
import { ErrorBoundary as ExpoErrorBoundary } from 'expo-router'
export const ErrorBoundary = Platform.OS === 'web'
  ? ({ children }: any) => children  // No error boundary on web — let it render
  : ExpoErrorBoundary

export const unstable_settings = {
  initialRouteName: '(tabs)',
}

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  })
  const appState = useRef(AppState.currentState)

  useEffect(() => {
    if (error) throw error
  }, [error])

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  // Set up notification channel and preload sounds on launch
  useEffect(() => {
    setupNotificationChannel()
    preloadSounds()
  }, [])

  // Re-schedule notifications and check batch statuses on app foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        try {
          await rescheduleAllActiveNotifications()
          await checkBatchStatuses()
        } catch (e) {
          console.warn('Foreground check failed:', e)
        }
      }
      appState.current = nextState
    })
    return () => sub.remove()
  }, [])

  // Handle notification taps — navigate to batch detail
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      playSound('soft-chime')
      const data = response.notification.request.content.data
      if (data?.batchId) {
        router.push({ pathname: '/batch/[id]', params: { id: data.batchId as string } })
      }
    })
    return () => sub.remove()
  }, [])

  if (!loaded) {
    return null
  }

  return <RootLayoutNav />
}

function RootLayoutNav() {
  const colorScheme = useColorScheme()

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <DatabaseProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="batch/new" options={{ title: 'New Batch', presentation: 'modal' }} />
          <Stack.Screen name="batch/[id]" options={{ title: 'Batch Detail' }} />
          <Stack.Screen name="character/[id]" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        </Stack>
      </DatabaseProvider>
    </ThemeProvider>
  )
}
