import { View, Text, StyleSheet } from 'react-native'
import { theme } from '../types/theme'
import type { Message, AgentMode } from '../types'
import { AGENT_MODES } from '../types/agents'

interface MessageBubbleProps {
  message: Message
  agentMode: AgentMode
}

export function MessageBubble({ message, agentMode }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  const agentColor = isUser ? theme.primary : AGENT_MODES[agentMode]?.color ?? theme.accent

  if (isSystem) {
    return (
      <View style={styles.systemContainer}>
        <Text style={styles.systemText}>{message.content}</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      {!isUser && (
        <View style={[styles.roleDot, { backgroundColor: agentColor }]} />
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.assistantText]}>
          {message.content}
        </Text>
        <Text style={styles.time}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
  },
  roleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 12,
    marginRight: 8,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: theme.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#ffffff',
  },
  assistantText: {
    color: theme.text,
  },
  time: {
    fontSize: 10,
    color: theme.textMuted,
    marginTop: 4,
    textAlign: 'right',
  },
  systemContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  systemText: {
    fontSize: 12,
    color: theme.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
})
