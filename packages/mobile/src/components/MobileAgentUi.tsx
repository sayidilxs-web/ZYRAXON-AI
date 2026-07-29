import { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { theme } from '../types/theme'
import { MobileAgentEngine } from '../mobile-agent/agent-engine'
import { executeAction } from '../mobile-agent/action-executor'
import { takeScreenshot } from '../mobile-agent/vision-service'
import { voiceService } from '../services/voice-service'
import type { DeviceAction, AgentEvent } from '../mobile-agent/protocol'

interface MobileAgentUiProps {
  onActionLog: (log: string) => void
  onScreenshotTaken: (base64: string) => void
  isActive: boolean
  setIsActive: (v: boolean) => void
}

export function MobileAgentUi({ onActionLog, onScreenshotTaken, isActive, setIsActive }: MobileAgentUiProps) {
  const engineRef = useRef<MobileAgentEngine | null>(null)
  const [visionEnabled, setVisionEnabled] = useState(false)
  const [lastAction, setLastAction] = useState<string>('')

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new MobileAgentEngine((event: AgentEvent) => {
        switch (event.type) {
          case 'screenshot_taken':
            if ('base64' in event && event.base64) {
              onScreenshotTaken(event.base64)
            }
            break
          case 'action_result':
            setLastAction(
              `${event.action.type}${event.success ? ' ✓' : ' ✗'}${event.error ? ': ' + event.error : ''}`,
            )
            onActionLog(`Action: ${event.action.type} -> ${event.success ? 'OK' : 'FAIL: ' + (event.error ?? '')}`)
            break
          case 'error':
            onActionLog(`Error: ${event.message}`)
            break
        }
      })
    }
    return () => {
      engineRef.current?.stopAutoScreenshot()
    }
  }, [])

  const handleScreenshot = useCallback(async () => {
    const b64 = await takeScreenshot()
    if (b64?.base64) {
      onScreenshotTaken(b64.base64)
    }
  }, [])

  const handleOpenYoutube = useCallback(async () => {
    const result = await executeAction({ type: 'open_app', target: 'youtube' })
    onActionLog(`Open YouTube: ${result.success ? 'OK' : 'FAIL'}`)
  }, [])

  const handleOpenChrome = useCallback(async () => {
    const result = await executeAction({ type: 'open_app', target: 'chrome' })
    onActionLog(`Open Chrome: ${result.success ? 'OK' : 'FAIL'}`)
  }, [])

  const handleOpenSettings = useCallback(async () => {
    const result = await executeAction({ type: 'open_app', target: 'settings' })
    onActionLog(`Open Settings: ${result.success ? 'OK' : 'FAIL'}`)
  }, [])

  const handleVoiceAction = useCallback(async () => {
    voiceService.startListening()
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.toolBtn, isActive && styles.activeBtn]}
          onPress={() => setIsActive(!isActive)}
        >
          <Text style={styles.toolBtnText}>🤖 {isActive ? 'ON' : 'OFF'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolBtn, visionEnabled && styles.activeBtn]}
          onPress={() => setVisionEnabled(!visionEnabled)}
        >
          <Text style={styles.toolBtnText}>👁 {visionEnabled ? 'ON' : 'OFF'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={handleScreenshot}>
          <Text style={styles.toolBtnText}>📸</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={handleVoiceAction}>
          <Text style={styles.toolBtnText}>🎤</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionRow}>
          <ActionButton label="YouTube" icon="▶" onPress={handleOpenYoutube} color="#ff0000" />
          <ActionButton label="Chrome" icon="🌐" onPress={handleOpenChrome} color="#4285f4" />
          <ActionButton label="Settings" icon="⚙" onPress={handleOpenSettings} color="#6b7280" />
        </View>
      </View>
      {lastAction !== '' && (
        <View style={styles.lastAction}>
          <Text style={styles.lastActionText}>Last: {lastAction}</Text>
        </View>
      )}
    </View>
  )
}

function ActionButton({
  label,
  icon,
  onPress,
  color,
}: {
  label: string
  icon: string
  onPress: () => void
  color: string
}) {
  return (
    <TouchableOpacity style={[styles.actionBtn, { borderColor: color + '40' }]} onPress={onPress}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  toolbar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  toolBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  activeBtn: {
    borderColor: theme.primary,
    backgroundColor: theme.primary + '20',
  },
  toolBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
  },
  quickActions: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textMuted,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: theme.card,
    borderWidth: 1,
    gap: 6,
  },
  actionIcon: {
    fontSize: 16,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  lastAction: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: theme.surfaceLight,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  lastActionText: {
    fontSize: 11,
    color: theme.textMuted,
    fontFamily: Platform?.OS === 'ios' ? 'Menlo' : 'monospace',
  },
})
