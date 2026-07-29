import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { theme } from '../src/types/theme'
import { Header } from '../src/components/Header'
import { getServerUrl, setServerUrl, healthCheck, getAgentServerUrl, setAgentServerUrl, agentHealthCheck } from '../src/services/api'

export default function SettingsScreen() {
  const [serverInput, setServerInput] = useState(getServerUrl())
  const [serverStatus, setServerStatus] = useState<'unknown' | 'online' | 'offline'>('unknown')
  const [checking, setChecking] = useState(false)
  const [agentInput, setAgentInput] = useState(getAgentServerUrl())
  const [agentStatus, setAgentStatus] = useState<'unknown' | 'online' | 'offline'>('unknown')
  const [agentChecking, setAgentChecking] = useState(false)

  useEffect(() => {
    setServerInput(getServerUrl())
    setAgentInput(getAgentServerUrl())
  }, [])

  async function handleSave() {
    const url = serverInput.trim()
    if (!url) { Alert.alert('Error', 'Server URL cannot be empty'); return }
    setServerUrl(url)
    Alert.alert('Saved', `Main server URL updated`)
  }

  async function handleCheck() {
    setChecking(true); setServerStatus('unknown')
    const ok = await healthCheck()
    setServerStatus(ok ? 'online' : 'offline'); setChecking(false)
  }

  async function handleAgentSave() {
    const url = agentInput.trim()
    if (!url) { Alert.alert('Error', 'Agent server URL cannot be empty'); return }
    setAgentServerUrl(url)
    Alert.alert('Saved', `Agent server URL updated`)
  }

  async function handleAgentCheck() {
    setAgentChecking(true); setAgentStatus('unknown')
    const ok = await agentHealthCheck()
    setAgentStatus(ok ? 'online' : 'offline'); setAgentChecking(false)
  }

  return (
    <View style={styles.container}>
      <Header title="Settings" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>ZYRAXON Main Server</Text>
        <Text style={styles.label}>Chat & AI Server URL</Text>
        <TextInput style={styles.input} value={serverInput} onChangeText={setServerInput}
          placeholder="http://localhost:8080" placeholderTextColor={theme.textMuted}
          autoCapitalize="none" autoCorrect={false} />
        <View style={styles.row}>
          <TouchableOpacity style={styles.btn} onPress={handleSave}><Text style={styles.btnText}>Save</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.checkBtn]} onPress={handleCheck} disabled={checking}>
            <Text style={styles.btnText}>{checking ? 'Checking...' : 'Test'}</Text>
          </TouchableOpacity>
        </View>
        {serverStatus !== 'unknown' && (
          <View style={[styles.statusBadge, serverStatus === 'online' ? styles.online : styles.offline]}>
            <Text style={styles.statusText}>{serverStatus === 'online' ? 'Online ✓' : 'Offline ✗'}</Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Mobile Agent Server</Text>
        <Text style={styles.label}>Device Automation & Vision AI</Text>
        <TextInput style={styles.input} value={agentInput} onChangeText={setAgentInput}
          placeholder="http://localhost:3001" placeholderTextColor={theme.textMuted}
          autoCapitalize="none" autoCorrect={false} />
        <View style={styles.row}>
          <TouchableOpacity style={styles.btn} onPress={handleAgentSave}><Text style={styles.btnText}>Save</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.checkBtn]} onPress={handleAgentCheck} disabled={agentChecking}>
            <Text style={styles.btnText}>{agentChecking ? 'Checking...' : 'Test'}</Text>
          </TouchableOpacity>
        </View>
        {agentStatus !== 'unknown' && (
          <View style={[styles.statusBadge, agentStatus === 'online' ? styles.online : styles.offline]}>
            <Text style={styles.statusText}>{agentStatus === 'online' ? 'Online ✓' : 'Offline ✗'}</Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>About</Text>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>ZYRAXON AI Mobile</Text>
          <Text style={styles.aboutVersion}>Version 1.0.0</Text>
          <Text style={styles.aboutDesc}>
            Full mobile AI agent with vision, voice, and device automation.{'\n'}
            Connects to ZYRAXON server for AI + mobile agent server for device control.
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 12 },
  label: { fontSize: 13, color: theme.textDim, marginBottom: 6 },
  input: { backgroundColor: theme.inputBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.text, borderWidth: 1, borderColor: theme.inputBorder, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, backgroundColor: theme.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  checkBtn: { backgroundColor: theme.surfaceLight, borderWidth: 1, borderColor: theme.border },
  btnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  statusBadge: { marginTop: 12, padding: 10, borderRadius: 8, alignItems: 'center' },
  online: { backgroundColor: '#22c55e20', borderWidth: 1, borderColor: '#22c55e' },
  offline: { backgroundColor: '#ef444420', borderWidth: 1, borderColor: '#ef4444' },
  statusText: { fontSize: 13, fontWeight: '600', color: theme.text },
  aboutCard: { backgroundColor: theme.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.cardBorder },
  aboutTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 4 },
  aboutVersion: { fontSize: 13, color: theme.textMuted, marginBottom: 8 },
  aboutDesc: { fontSize: 13, color: theme.textDim, lineHeight: 20 },
})
