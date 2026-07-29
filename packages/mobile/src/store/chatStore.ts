import type { AgentMode, Message, Session } from '../types'

const STORAGE_KEY = 'zyraxon_sessions'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveSessions(sessions: Session[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  } catch {}
}

function createNewSession(agentMode: AgentMode): Session {
  return {
    id: generateId(),
    title: 'New Chat',
    messages: [],
    agentMode,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

let sessions = loadSessions()
let currentSessionId: string | null = sessions[0]?.id ?? null
let listeners: Array<() => void> = []

function notify() {
  for (const fn of listeners) fn()
}

export const chatStore = {
  getSessions(): Session[] {
    return sessions
  },

  getCurrentSession(): Session | null {
    return sessions.find((s) => s.id === currentSessionId) ?? null
  },

  getCurrentSessionId(): string | null {
    return currentSessionId
  },

  setCurrentSession(id: string) {
    currentSessionId = id
    notify()
  },

  createSession(agentMode: AgentMode = 'general'): Session {
    const session = createNewSession(agentMode)
    sessions = [session, ...sessions]
    currentSessionId = session.id
    saveSessions(sessions)
    notify()
    return session
  },

  addMessage(content: string, role: Message['role'], agentMode?: AgentMode) {
    let session = sessions.find((s) => s.id === currentSessionId)
    if (!session) {
      session = createNewSession(agentMode ?? 'general')
      sessions.unshift(session)
      currentSessionId = session.id
    } else if (agentMode) {
      session.agentMode = agentMode
    }
    const message: Message = {
      id: generateId(),
      role,
      content,
      timestamp: Date.now(),
    }
    session.messages.push(message)
    session.updatedAt = Date.now()
    if (session.title === 'New Chat' && role === 'user') {
      session.title = content.slice(0, 50) + (content.length > 50 ? '...' : '')
    }
    saveSessions(sessions)
    notify()
    return message
  },

  clearCurrentSession() {
    const session = sessions.find((s) => s.id === currentSessionId)
    if (session) {
      session.messages = []
      session.title = 'New Chat'
      session.updatedAt = Date.now()
      saveSessions(sessions)
      notify()
    }
  },

  deleteSession(id: string) {
    sessions = sessions.filter((s) => s.id !== id)
    if (currentSessionId === id) {
      currentSessionId = sessions[0]?.id ?? null
    }
    saveSessions(sessions)
    notify()
  },

  subscribe(fn: () => void): () => void {
    listeners.push(fn)
    return () => {
      listeners = listeners.filter((f) => f !== fn)
    }
  },
}
