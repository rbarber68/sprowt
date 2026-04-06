import { Link, Stack } from 'expo-router'
import { View, Text } from 'react-native'

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center p-6 bg-white">
        <Text className="text-5xl mb-4">🌱</Text>
        <Text className="text-xl font-bold text-sprout-800 mb-4">
          This screen doesn't exist.
        </Text>
        <Link href="/">
          <Text className="text-sprout-600 underline">Go to home screen</Text>
        </Link>
      </View>
    </>
  )
}
