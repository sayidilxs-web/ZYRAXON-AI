import { View, Text, StyleSheet } from 'react-native'
import { theme } from '../src/types/theme'
import { Header } from '../src/components/Header'

const memoryItems = [
  { key: 'preferences', label: 'User Preferences', desc: 'Language, theme, agent mode defaults' },
  { key: 'projects', label: 'Active Projects', desc: 'Current project context and files' },
  { key: 'learned', label: 'Learned Patterns', desc: 'Code style, naming conventions, preferences' },
  { key: 'history', label: 'Chat History', desc: 'Full conversation log across sessions' },
]

export default function MemoryScreen() {
  return (
    <View style={styles.container}>
      <Header title="Memory" subtitle="What ZYRAXON remembers" />
      <View style={styles.content}>
        {memoryItems.map((item) => (
          <View key={item.key} style={styles.card}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>◆</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.desc}>{item.desc}</Text>
            </View>
          </View>
        ))}
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>Memory is stored locally on your device</Text>
          <Text style={styles.statusSubtext}>No data is sent to external servers</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.primary + '25',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 16,
    color: theme.primary,
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  desc: {
    fontSize: 12,
    color: theme.textDim,
  },
  statusCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  statusText: {
    fontSize: 13,
    color: theme.textDim,
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 11,
    color: theme.textMuted,
  },
})
