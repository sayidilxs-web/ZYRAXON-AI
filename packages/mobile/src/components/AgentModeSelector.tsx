import React from 'react'
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native'
import { theme } from '../types/theme'
import { AGENT_MODES, AGENT_MODE_LIST } from '../types/agents'
import type { AgentMode } from '../types/agents'

interface AgentModeSelectorProps {
  visible: boolean
  selectedMode: AgentMode
  onSelect: (mode: AgentMode) => void
  onClose: () => void
}

export function AgentModeSelector({ visible, selectedMode, onSelect, onClose }: AgentModeSelectorProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Agent Mode</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            {AGENT_MODE_LIST.map(mode => (
              <TouchableOpacity
                key={mode}
                style={[styles.item, selectedMode === mode && styles.selectedItem]}
                onPress={() => {
                  onSelect(mode)
                  onClose()
                }}
              >
                <Text style={styles.icon}>{AGENT_MODES[mode].icon}</Text>
                <View style={styles.info}>
                  <Text style={styles.name}>{AGENT_MODES[mode].name}</Text>
                  <Text style={styles.desc}>{AGENT_MODES[mode].description}</Text>
                </View>
                {selectedMode === mode && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { backgroundColor: theme.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
  title: { fontSize: 18, fontWeight: '600', color: theme.text },
  closeButton: { fontSize: 24, color: theme.textMuted },
  item: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
  selectedItem: { backgroundColor: theme.bg },
  icon: { fontSize: 28, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: theme.text },
  desc: { fontSize: 14, color: theme.textMuted, marginTop: 2 },
  check: { fontSize: 20, color: theme.primary },
})
