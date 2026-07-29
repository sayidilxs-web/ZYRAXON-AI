import { useEffect, useState, useCallback } from 'react'
import { View, FlatList, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { theme } from '../src/types/theme'
import { chatStore } from '../src/store/chatStore'
import { AGENT_MODES } from '../src/types/agents'
import { Header } from '../src/components/Header'
import type { Session } from '../src/types'

export default function SessionsScreen() {
  const [sessions, setSessions] = useState<Session[]>([])
  const router = useRouter()

  useEffect(() => {
    setSessions(chatStore.getSessions())
    return chatStore.subscribe(() => {
      setSessions(chatStore.getSessions())
    })
  }, [])

  const handleSelect = useCallback((id: string) => {
    chatStore.setCurrentSession(id)
    router.navigate('/')
  }, [router])

  const handleDelete = useCallback((id: string, title: string) => {
    Alert.alert('Delete Session', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => chatStore.deleteSession(id) },
    ])
  }, [])

  return (
    <View style={styles.container}>
      <Header title="Sessions" />
      {sessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No sessions yet</Text>
          <Text style={styles.emptySubtext}>Start a new chat to begin</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const color = AGENT_MODES[item.agentMode]?.color ?? theme.primary
            return (
              <TouchableOpacity
                style={styles.sessionCard}
                onPress={() => handleSelect(item.id)}
                onLongPress={() => handleDelete(item.id, item.title)}
              >
                <View style={[styles.indicator, { backgroundColor: color }]} />
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionTitle}>{item.title}</Text>
                  <Text style={styles.sessionMeta}>
                    {AGENT_MODES[item.agentMode]?.label ?? item.agentMode} · {item.messages.length} msgs
                  </Text>
                </View>
                <Text style={styles.sessionTime}>
                  {new Date(item.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </Text>
              </TouchableOpacity>
            )
          }}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  list: {
    padding: 12,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  indicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  sessionMeta: {
    fontSize: 12,
    color: theme.textMuted,
  },
  sessionTime: {
    fontSize: 11,
    color: theme.textMuted,
    marginLeft: 8,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.textDim,
  },
  emptySubtext: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 4,
  },
})
