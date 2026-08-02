import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { theme } from '../types/theme'
import type { DeviceAction } from '../mobile-agent/protocol'

interface MobileAgentUiProps {
  active: boolean
  lastScreenshot: string | null
  onAction: (action: DeviceAction) => void
  onClose: () => void
}

export function MobileAgentUi({ active, lastScreenshot, onAction, onClose }: MobileAgentUiProps) {
  if (!active) return null

  const actions: { label: string; action: DeviceAction }[] = [
    { label: '📱 Click', action: { type: 'click', x: 100, y: 100 } },
    { label: '⌨️ Input', action: { type: 'input', text: 'Hello' } },
    { label: '📸 Screenshot', action: { type: 'screenshot' } },
    { label: '⬆️ Scroll Up', action: { type: 'scroll', direction: 'up' } },
    { label: '⬇️ Scroll Down', action: { type: 'scroll', direction: 'down' } },
  ]

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mobile Agent</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.close}>✕</Text>
        </TouchableOpacity>
      </View>
      {lastScreenshot && (
        <View style={styles.screenshot}>
          <Text style={styles.screenshotPlaceholder}>[Screenshot Preview]</Text>
        </View>
      )}
      <View style={styles.actions}>
        {actions.map((item, i) => (
          <TouchableOpacity key={i} style={styles.actionButton} onPress={() => onAction(item.action)}>
            <Text style={styles.actionLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { backgroundColor: theme.surface, borderRadius: 16, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '600', color: theme.text },
  close: { fontSize: 20, color: theme.textMuted },
  screenshot: { height: 150, backgroundColor: theme.bg, borderRadius: 8, marginBottom: 12, justifyContent: 'center', alignItems: 'center' },
  screenshotPlaceholder: { color: theme.textMuted },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionButton: { backgroundColor: theme.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  actionLabel: { color: '#fff', fontSize: 14 },
})
