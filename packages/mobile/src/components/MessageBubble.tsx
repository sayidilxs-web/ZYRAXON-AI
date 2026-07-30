import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { theme } from '../types/theme'
import type { Message } from '../types'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.content, isUser && styles.userContent]}>{message.content}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 4 },
  userContainer: { alignItems: 'flex-end' },
  assistantContainer: { alignItems: 'flex-start' },
  bubble: { maxWidth: '80%', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 },
  userBubble: { backgroundColor: theme.primary, borderBottomRightRadius: 4 },
  assistantBubble: { backgroundColor: theme.surface, borderBottomLeftRadius: 4 },
  content: { fontSize: 16, color: theme.text, lineHeight: 22 },
  userContent: { color: '#fff' },
})
