import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { theme } from '../types/theme'

interface HeaderProps {
  title: string
  subtitle?: string
  color?: string
  onMenuPress?: () => void
  rightAction?: () => void
  rightIcon?: string
}

export function Header({ title, subtitle, color, onMenuPress, rightAction, rightIcon }: HeaderProps) {
  return (
    <View style={styles.container}>
      {onMenuPress && (
        <TouchableOpacity onPress={onMenuPress} style={styles.iconBtn}>
          <Text style={styles.icon}>☰</Text>
        </TouchableOpacity>
      )}
      <View style={styles.titleArea}>
        <Text style={[styles.title, color ? { color } : null]}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {rightAction && (
        <TouchableOpacity onPress={rightAction} style={styles.iconBtn}>
          <Text style={styles.icon}>{rightIcon ?? '⚙'}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: theme.tabBorder,
  },
  titleArea: {
    flex: 1,
    marginLeft: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  subtitle: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },
  iconBtn: {
    padding: 8,
  },
  icon: {
    fontSize: 20,
    color: theme.text,
  },
})
