import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { AgentMode } from '../types/agents'
import { AGENT_MODES } from '../types/agents'

interface AgentModeCardProps {
  mode: AgentMode
  selected: boolean
  onPress: () => void
}

export function AgentModeCard({ mode, selected, onPress }: AgentModeCardProps) {
  const info = AGENT_MODES[mode]
  return (
    <TouchableOpacity style={[styles.card, selected && { borderColor: info.color, borderWidth: 2 }]} onPress={onPress}>
      <Text style={styles.icon}>{info.icon}</Text>
      <Text style={styles.name}>{info.name}</Text>
      {selected && <View style={[styles.indicator, { backgroundColor: info.color }]} />}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: '#1f2937', borderWidth: 1, borderColor: 'transparent', width: 80 },
  icon: { fontSize: 24 },
  name: { fontSize: 12, marginTop: 4, color: '#fff' },
  indicator: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
})
