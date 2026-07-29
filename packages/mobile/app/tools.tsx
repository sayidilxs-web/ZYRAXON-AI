import { useEffect, useState } from 'react'
import { View, FlatList, Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { theme } from '../src/types/theme'
import { chatStore } from '../src/store/chatStore'
import { AGENT_MODE_LIST } from '../src/types/agents'
import { AgentModeCard } from '../src/components/AgentModeCard'
import { Header } from '../src/components/Header'
import type { AgentMode } from '../src/types'

export default function ToolsScreen() {
  const [currentMode, setCurrentMode] = useState<AgentMode>('general')
  const router = useRouter()

  useEffect(() => {
    const session = chatStore.getCurrentSession()
    if (session) setCurrentMode(session.agentMode)
    return chatStore.subscribe(() => {
      const s = chatStore.getCurrentSession()
      if (s) setCurrentMode(s.agentMode)
    })
  }, [])

  function handleSelect(mode: AgentMode) {
    const session = chatStore.getCurrentSession()
    if (session) {
      session.agentMode = mode
      chatStore.setCurrentSession(session.id)
      router.navigate('/')
    }
  }

  return (
    <View style={styles.container}>
      <Header title="Agent Modes" subtitle="Choose your AI power level" />
      <FlatList
        data={AGENT_MODE_LIST}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AgentModeCard
            config={item}
            isActive={item.id === currentMode}
            onSelect={() => handleSelect(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.hint}>
            Tap a mode to switch. The active mode is highlighted.
          </Text>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  list: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  hint: {
    fontSize: 12,
    color: theme.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
})
