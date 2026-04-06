import { Link, Stack } from 'expo-router'
import { View, Text } from 'react-native'

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#ffffff' }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🌱</Text>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#27500A', marginBottom: 16 }}>
          This screen doesn't exist.
        </Text>
        <Link href="/">
          <Text style={{ color: '#3B6D11', textDecorationLine: 'underline' }}>Go to home screen</Text>
        </Link>
      </View>
    </>
  )
}
