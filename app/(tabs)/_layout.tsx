import React from 'react'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { Link, Tabs } from 'expo-router'
import { View, Text, Pressable, Platform } from 'react-native'

function TabBarIcon({ name, color, label, focused }: {
  name: React.ComponentProps<typeof FontAwesome>['name']
  color: string
  label: string
  focused: boolean
}) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 6 }}>
      {focused && (
        <View style={{
          position: 'absolute',
          top: 0,
          width: 32,
          height: 3,
          borderRadius: 2,
          backgroundColor: '#3B6D11',
        }} />
      )}
      <FontAwesome name={name} size={20} color={color} />
      <Text style={{
        fontSize: 10,
        color,
        marginTop: 2,
        fontWeight: focused ? '700' : '400',
      }}>
        {label}
      </Text>
    </View>
  )
}

function SettingsButton() {
  return (
    <Link href="/settings" asChild>
      <Pressable style={{
        marginRight: 16,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <FontAwesome name="gear" size={18} color="#666" />
      </Pressable>
    </Link>
  )
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3B6D11',
        tabBarInactiveTintColor: '#aaa',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          height: Platform.OS === 'android' ? 64 : 84,
          paddingBottom: Platform.OS === 'android' ? 8 : 24,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: '#fff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: '#27500A',
        },
        headerRight: () => <SettingsButton />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Farm',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="leaf" color={color} label="Farm" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: 'Planner',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="calendar" color={color} label="Plan" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="book" color={color} label="Library" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="archive" color={color} label="History" focused={focused} />
          ),
        }}
      />
    </Tabs>
  )
}
