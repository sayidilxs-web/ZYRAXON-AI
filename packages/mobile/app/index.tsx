import { useEffect, useState, useRef, useCallback } from 'react'
import { View, FlatList, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native'
import { theme } from '../src/types/theme'
import { chatStore } from '../src/store/chatStore'
import { streamChat, type AiResponse } from '../src/services/api'
import { executeAction, executeActionBatch, ensureInitialized, takeScreenshotBase64 } from '../src/mobile-agent/action-executor'
import type { DeviceAction } from '../src/mobile-agent/protocol'
import { voiceService } from '../src/services/voice-service'
import { Header } from '../src/components/Header'
import { ChatInput } from '../src/components/ChatInput'
import { MessageBubble } from '../src/components/MessageBubble'
import { AgentModeSelector } from '../src/components/AgentModeSelector'
import { MobileAgentUi } from '../src/components/MobileAgentUi'
import { AGENT_MODES } from '../src/types/agents'
import type { AgentMode, Message } from '../src/types'

export default function ChatScreen() {
  const [session, setSession] = useState(chatStore.getCurrentSession())
  const [showAgentPicker, setShowAgentPicker] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [mobileAgentActive, setMobileAgentActive] = useState(false)
  const [showVisionPanel, setShowVisionPanel] = useState(false)
  const [lastScreenshot, setLastScreenshot] = useState<string | null>(null)
  const [logLines, setLogLines] = useState<string[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const flatListRef = useRef<FlatList>(null)

  const agentMode = session?.agentMode ?? 'general'
  const agentColor = AGENT_MODES[agentMode]?.color ?? theme.primary

  useEffect(() => {
    return chatStore.subscribe(() => {
      setSession(chatStore.getCurrentSession())
    })
  }, [])

  useEffect(() => {
    if (!session) {
      chatStore.createSession('general')
    }
  }, [session])

  useEffect(() => {
    voiceService.setCallbacks({
      onTranscript: (text) => {
        if (text && text !== 'Listening...') {
          handleSend(text)
        }
      },
      onSpeakingState: (speaking) => {},
      onError: (error) => {
        addLog(`Voice error: ${error}`)
      },
    })
  }, [])

  const addLog = useCallback((line: string) => {
    setLogLines((prev) => [...prev.slice(-50), `[${new Date().toLocaleTimeString()}] ${line}`])
  }, [])

  const executeActions = useCallback(async (actions: DeviceAction[]): Promise<string | null> => {
    let screenshot: string | null = null
    for (const action of actions) {
      addLog(`Executing: ${action.type}${action.target ? ' → ' + action.target : ''}`)
      const result = await executeAction(action)
      addLog(`Result: ${result.success ? '✓' : '✗'}${result.error ? ' - ' + result.error : ''}`)
      if (action.type !== 'wait' && action.type !== 'speak_text') {
        screenshot = await takeScreenshotBase64()
        if (screenshot) setLastScreenshot(screenshot)
      }
    }
    return screenshot
  }, [addLog])

  const processWithVisionLoop = useCallback(async (
    text: string,
    history: Array<{ role: string; content: string }>,
    initialScreenshot?: string | null,
  ) => {
    const MAX_CYCLES = 5
    let cycleText = text
    let cycleHistory = [...history]
    let screenshot = initialScreenshot ?? null
    let cycleCount = 0

    while (cycleCount < MAX_CYCLES) {
      addLog(`Vision cycle ${cycleCount + 1}/${MAX_CYCLES}`)
      setStreaming(true)

      if (screenshot) {
        setShowVisionPanel(true)
      }

      await streamChat(
        cycleText,
        cycleHistory,
        agentMode,
        (token) => setStreamingText((prev) => prev + token),
        async (response: AiResponse) => {
          const fullText = streamingText || response.text
          chatStore.addMessage(fullText, 'assistant')
          setStreamingText('')
          setStreaming(false)

          if (response.actions && response.actions.length > 0) {
            await ensureInitialized()
            screenshot = await executeActions(response.actions)
            cycleCount++
            if (cycleCount >= MAX_CYCLES || response.finish_reason === 'complete') {
              addLog('Task complete')
              return
            }
            cycleText = 'Did the actions succeed? What should I do next based on the screen?'
            cycleHistory = [
              { role: 'system', content: 'You are executing mobile actions. Verify the screen result.' },
              ...cycleHistory.slice(-10),
              { role: 'assistant', content: fullText },
              { role: 'user', content: cycleText },
            ]
          } else {
            addLog('No actions needed')
          }
        },
        (err) => {
          addLog(`Cycle error: ${err.message}`)
          setStreamingText('')
          setStreaming(false)
        },
        screenshot ? [{ base64: screenshot, timestamp: Date.now(), type: 'screenshot' }] : undefined,
        { platform: Platform.OS, current_app: 'unknown' },
      )
    }
  }, [agentMode, executeActions, addLog])

  const handleSend = useCallback(async (text: string) => {
    if (streaming) return
    chatStore.addMessage(text, 'user', agentMode)
    setStreaming(true)
    setStreamingText('')

    const history = (chatStore.getCurrentSession()?.messages ?? [])
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }))

    if (agentMode === 'vision' || agentMode === 'apex-predator') {
      setStreaming(false)
      processWithVisionLoop(text, history, null)
      return
    }

    const controller = await streamChat(
      text,
      history,
      agentMode,
      (token) => setStreamingText((prev) => prev + token),
      async (response: AiResponse) => {
        const fullText = streamingText || response.text
        chatStore.addMessage(fullText, 'assistant')
        setStreamingText('')
        setStreaming(false)

        if (response.actions && response.actions.length > 0) {
          await ensureInitialized()
          const screenshot = await executeActions(response.actions)
          if (response.finish_reason !== 'complete' && screenshot) {
            processWithVisionLoop('Based on the screen, did the actions work? What next?', history, screenshot)
          }
        }
      },
      (err) => {
        chatStore.addMessage(`Error: ${err.message}`, 'assistant')
        setStreamingText('')
        setStreaming(false)
      },
    )
    abortRef.current = controller
  }, [agentMode, streaming, executeActions, addLog, processWithVisionLoop])

  const handleVoiceToggle = useCallback(async () => {
    if (voiceService.getListeningState()) {
      await voiceService.stopListening()
    } else {
      await voiceService.startListening()
    }
  }, [])

  const handleAgentSelect = useCallback((mode: AgentMode) => {
    const s = chatStore.getCurrentSession()
    if (s) {
      s.agentMode = mode
      chatStore.setCurrentSession(s.id)
    }
  }, [])

  const handleScreenshotTaken = useCallback((base64: string) => {
    setLastScreenshot(base64)
    setShowVisionPanel(true)
    addLog('Screenshot captured')
  }, [])

  const messages: Message[] = session?.messages ?? []
  const allMessages = streamingText
    ? [...messages, { id: 'streaming', role: 'assistant' as const, content: streamingText, timestamp: Date.now() }]
    : messages

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Header
        title="ZYRAXON AI"
        subtitle={AGENT_MODES[agentMode]?.label ?? 'General'}
        color={agentColor}
        onMenuPress={() => setShowAgentPicker(true)}
        rightAction={handleVoiceToggle}
        rightIcon="🎤"
      />
      {showVisionPanel && lastScreenshot && (
        <View style={styles.visionPreview}>
          <Image source={{ uri: `data:image/png;base64,${lastScreenshot}` }} style={styles.visionImage} />
          <Text style={styles.visionHint}>Screen captured | Agent can see your screen</Text>
        </View>
      )}
      <FlatList
        ref={flatListRef}
        data={allMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble message={item} agentMode={agentMode} />}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>ZYRAXON AI</Text>
            <Text style={styles.emptyText}>{AGENT_MODES[agentMode]?.description ?? 'Ready to help'}</Text>
            <Text style={styles.emptyHint}>
              Tap 🎤 for voice · Tap ☰ for agent modes · Tap 🤖 for device control
            </Text>
          </View>
        }
      />
      {mobileAgentActive && (
        <MobileAgentUi
          onActionLog={addLog}
          onScreenshotTaken={handleScreenshotTaken}
          isActive={mobileAgentActive}
          setIsActive={setMobileAgentActive}
        />
      )}
      {logLines.length > 0 && (
        <View style={styles.logPanel}>
          {logLines.slice(-3).map((line, i) => (
            <Text key={i} style={styles.logText}>{line}</Text>
          ))}
        </View>
      )}
      <ChatInput
        onSend={handleSend}
        onVoicePress={handleVoiceToggle}
        disabled={streaming}
        placeholder={streaming ? 'Waiting for response...' : 'Type a message...'}
      />
      <AgentModeSelector
        visible={showAgentPicker}
        currentMode={agentMode}
        onSelect={handleAgentSelect}
        onClose={() => setShowAgentPicker(false)}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  listContent: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: theme.textMuted,
  },
  emptyHint: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  visionPreview: {
    backgroundColor: theme.surfaceLight,
    padding: 4,
    alignItems: 'center',
  },
  visionImage: {
    width: '100%',
    height: 80,
    borderRadius: 4,
    resizeMode: 'contain',
  },
  visionHint: {
    fontSize: 10,
    color: theme.textMuted,
    marginTop: 2,
  },
  logPanel: {
    backgroundColor: '#00000080',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  logText: {
    fontSize: 10,
    color: theme.accent,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
})
