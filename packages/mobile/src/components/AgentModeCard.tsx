import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { theme } from '../types/theme'
import type { AgentModeConfig } from '../types'

interface AgentModeCardProps {
  config: AgentModeConfig
  isActive: boolean
  onSelect: () => void
}

export function AgentModeCard({ config, isActive, onSelect }: AgentModeCardProps) {
  return (
    <TouchableOpacity
      onPress={onSelect}
      style={[
        styles.card,
        isActive && { borderColor: config.color, backgroundColor: config.color + '15' },
      ]}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, { backgroundColor: config.color + '25' }]}>
        <Text style={[styles.icon, { color: config.color }]}>◆</Text>
      </View>
      <Text style={[styles.label, isActive && { color: config.color }]}>
        {config.label}
      </Text>
      <Text style={styles.description} numberOfLines={2}>
        {config.description}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 14,
    marginVertical: 4,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: theme.textDim,
    lineHeight: 16,
  },
})
