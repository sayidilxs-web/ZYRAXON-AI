import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { theme } from '../types/theme'

interface HeaderProps {
  title: string
  onBack?: () => void
  right?: React.ReactNode
}

export function Header({ title, onBack, right }: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {onBack && (
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.right}>{right}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  left: { width: 40 },
  title: { flex: 1, fontSize: 18, fontWeight: '600', color: theme.text, textAlign: 'center' },
  right: { width: 40, alignItems: 'flex-end' },
  backButton: { fontSize: 24, color: theme.primary },
})
