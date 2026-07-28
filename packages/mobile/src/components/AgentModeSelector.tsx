import { View, Text, FlatList, Modal, TouchableOpacity, StyleSheet } from 'react-native'
import { theme } from '../types/theme'
import { AGENT_MODE_LIST } from '../types/agents'
import type { AgentMode } from '../types'
import { AgentModeCard } from './AgentModeCard'

interface AgentModeSelectorProps {
  visible: boolean
  currentMode: AgentMode
  onSelect: (mode: AgentMode) => void
  onClose: () => void
}

export function AgentModeSelector({ visible, currentMode, onSelect, onClose }: AgentModeSelectorProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Select Agent Mode</Text>
          <Text style={styles.subtitle}>Current: {currentMode}</Text>
          <FlatList
            data={AGENT_MODE_LIST}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <AgentModeCard
                config={item}
                isActive={item.id === currentMode}
                onSelect={() => {
                  onSelect(item.id)
                  onClose()
                }}
              />
            )}
            contentContainerStyle={styles.list}
          />
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.textMuted,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: theme.textMuted,
    textAlign: 'center',
    marginBottom: 8,
  },
  list: {
    paddingBottom: 8,
  },
  closeBtn: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textDim,
  },
})
