import React from 'react'
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { theme } from '../types/theme'

interface ChatInputProps {
  value: string
  onChangeText: (text: string) => void
  onSend: () => void
  onVoice?: () => void
  placeholder?: string
}

export function ChatInput({ value, onChangeText, onSend, onVoice, placeholder = 'Type a message...' }: ChatInputProps) {
  return (
    <View style={styles.container}>
      {onVoice && (
        <TouchableOpacity style={styles.voiceButton} onPress={onVoice}>
          <Text style={styles.voiceIcon}>🎤</Text>
        </TouchableOpacity>
      )}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        multiline
        maxLength={5000}
      />
      <TouchableOpacity style={[styles.sendButton, !value && styles.sendButtonDisabled]} onPress={onSend} disabled={!value}>
        <Text style={styles.sendIcon}>➤</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: theme.bg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: theme.text,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: theme.border,
  },
  sendIcon: { fontSize: 18, color: '#fff' },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  voiceIcon: { fontSize: 18 },
})
