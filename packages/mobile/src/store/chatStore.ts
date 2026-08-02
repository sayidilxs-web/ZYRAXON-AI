import type { Session, AgentMode, Message } from '../types'

class ChatStore {
  private sessions: Map<string, Session> = new Map()
  private currentSessionId: string | null = null
  private listeners: Set<() => void> = new Set()

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach(listener => listener())
  }

  createSession(agentMode: AgentMode = 'general'): Session {
    const id = `session-${Date.now()}`
    const session: Session = {
      id,
      title: 'New Chat',
      agentMode,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    this.sessions.set(id, session)
    this.currentSessionId = id
    this.notify()
    return session
  }

  getCurrentSession(): Session | null {
    if (!this.currentSessionId) return null
    return this.sessions.get(this.currentSessionId) || null
  }

  getSessions(): Session[] {
    return Array.from(this.sessions.values())
  }

  addMessage(sessionId: string, message: Message): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.messages.push(message)
      session.updatedAt = Date.now()
      this.notify()
    }
  }

  setCurrentSession(sessionId: string): void {
    if (this.sessions.has(sessionId)) {
      this.currentSessionId = sessionId
      this.notify()
    }
  }

  updateSession(sessionId: string, updates: Partial<Session>): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      Object.assign(session, updates, { updatedAt: Date.now() })
      this.notify()
    }
  }
}

export const chatStore = new ChatStore()
