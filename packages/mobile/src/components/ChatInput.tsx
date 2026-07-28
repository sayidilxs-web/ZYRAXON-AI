import { useState } from 'react'
import { View, TextInput, TouchableOpacity, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { theme } from '../types/theme'

interface ChatInputProps {
  onSend: (text: string) => void
  onVoicePress?: () => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ onSend, onVoicePress, disabled, placeholder }: ChatInputProps) {
  const [text, setText] = useState('')

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        {onVoicePress && (
          <TouchableOpacity onPress={onVoicePress} style={styles.voiceBtn}>
            <Text style={styles.voiceIcon}>🎤</Text>
          </TouchableOpacity>
        )}
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={placeholder ?? 'Type a message...'}
          placeholderTextColor={theme.textMuted}
          multiline
          maxLength={4000}
          editable={!disabled}
          onSubmitEditing={handleSend}
          blurOnSubmit
        />
        <TouchableOpacity
          onPress={handleSend}
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          disabled={!text.trim() || disabled}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  input: {
    flex: 1,
    backgroundColor: theme.inputBg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.text,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: theme.inputBorder,
  },
  voiceBtn: {
    padding: 10,
    marginRight: 4,
  },
  voiceIcon: {
    fontSize: 20,
  },
  sendBtn: {
    backgroundColor: theme.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: {
    backgroundColor: theme.textMuted,
    opacity: 0.4,
  },
  sendIcon: {
    fontSize: 16,
    color: '#fff',
  },
})
