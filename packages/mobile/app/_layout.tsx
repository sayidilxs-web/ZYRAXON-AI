import { useEffect } from 'react'
import { StatusBar } from 'react-native'
import { Tabs } from 'expo-router'
import { theme } from '../src/types/theme'

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  index: { active: '💬', inactive: '💬' },
  sessions: { active: '📋', inactive: '📋' },
  tools: { active: '🔧', inactive: '🔧' },
  memory: { active: '🧠', inactive: '🧠' },
  settings: { active: '⚙', inactive: '⚙' },
}

export default function RootLayout() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={theme.bg} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.tabBar,
            borderTopColor: theme.tabBorder,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 4,
          },
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textMuted,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Chat',
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={TAB_ICONS.index} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="sessions"
          options={{
            title: 'Sessions',
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={TAB_ICONS.sessions} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="tools"
          options={{
            title: 'Agents',
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={TAB_ICONS.tools} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="memory"
          options={{
            title: 'Memory',
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={TAB_ICONS.memory} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={TAB_ICONS.settings} focused={focused} />
            ),
          }}
        />
      </Tabs>
    </>
  )
}

function TabIcon({ icon, focused }: { icon: { active: string; inactive: string }; focused: boolean }) {
  const { Text } = require('react-native')
  return <Text style={{ fontSize: 22 }}>{focused ? icon.active : icon.inactive}</Text>
}
