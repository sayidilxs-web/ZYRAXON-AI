const GITHUB_API = "https://api.github.com"

interface AISession {
  id: string
  userId: string
  username: string
  startedAt: string
  lastActiveAt: string
  status: "active" | "idle" | "disconnected"
  capabilities: string[]
  memoryContext: any[]
}

interface AIConnectionState {
  connected: boolean
  session: AISession | null
  error: string | null
}

type AIEventType =
  | "connected"
  | "disconnected"
  | "message"
  | "tool_call"
  | "tool_result"
  | "error"
  | "sync"

interface AIEvent {
  type: AIEventType
  data: any
  timestamp: string
}

type AIEventListener = (event: AIEvent) => void

class AIConnectionService {
  private state: AIConnectionState = {
    connected: false,
    session: null,
    error: null,
  }
  private listeners: AIEventListener[] = []
  private token: string = ""
  private username: string = ""
  private syncInterval: number | null = null

  on(event: AIEventType, listener: AIEventListener): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private emit(type: AIEventType, data: any): void {
    const event: AIEvent = {
      type,
      data,
      timestamp: new Date().toISOString(),
    }
    this.listeners.forEach((listener) => listener(event))
  }

  async connect(token: string, username: string): Promise<boolean> {
    try {
      this.token = token
      this.username = username
      this.emit("message", { text: "Connecting to ZYRAXON AI..." })

      const session: AISession = {
        id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: `user-${username}`,
        username,
        startedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        status: "active",
        capabilities: [
          "code_generation",
          "code_review",
          " debugging",
          "architecture",
          "testing",
          "documentation",
          "refactoring",
          "security_analysis",
          "performance_optimization",
          "ui_design",
        ],
        memoryContext: [],
      }

      this.state = {
        connected: true,
        session,
        error: null,
      }

      this.emit("connected", { session })
      this.startSync()
      return true
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : "Connection failed"
      this.emit("error", { error: this.state.error })
      return false
    }
  }

  disconnect(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    this.state = {
      connected: false,
      session: null,
      error: null,
    }
    this.emit("disconnected", {})
  }

  private startSync(): void {
    this.syncInterval = window.setInterval(async () => {
      if (this.state.session) {
        this.state.session.lastActiveAt = new Date().toISOString()
        this.emit("sync", { session: this.state.session })
      }
    }, 30000)
  }

  isConnected(): boolean {
    return this.state.connected
  }

  getSession(): AISession | null {
    return this.state.session
  }

  async sendPrompt(prompt: string): Promise<any> {
    if (!this.state.connected || !this.state.session) {
      throw new Error("Not connected to AI")
    }

    this.state.session.lastActiveAt = new Date().toISOString()
    this.emit("message", { text: prompt, role: "user" })

    return {
      id: `response-${Date.now()}`,
      sessionId: this.state.session.id,
      prompt,
      response: null,
      status: "processing",
      createdAt: new Date().toISOString(),
    }
  }

  async executeTool(toolName: string, params: any): Promise<any> {
    if (!this.state.connected) {
      throw new Error("Not connected to AI")
    }

    this.emit("tool_call", { toolName, params })

    return {
      id: `tool-${Date.now()}`,
      toolName,
      params,
      result: null,
      status: "pending",
    }
  }

  async syncUserData(data: any): Promise<void> {
    if (!this.state.connected) return

    this.emit("sync", {
      type: "user_data",
      data,
      timestamp: new Date().toISOString(),
    })
  }

  async getMemoryContext(): Promise<any[]> {
    if (!this.state.session) return []
    return this.state.session.memoryContext
  }

  async addToMemoryContext(context: any): Promise<void> {
    if (this.state.session) {
      this.state.session.memoryContext.push(context)
      if (this.state.session.memoryContext.length > 100) {
        this.state.session.memoryContext = this.state.session.memoryContext.slice(-100)
      }
    }
  }

  getState(): AIConnectionState {
    return { ...this.state }
  }
}

let aiInstance: AIConnectionService | null = null

export function getAIConnection(): AIConnectionService {
  if (!aiInstance) {
    aiInstance = new AIConnectionService()
  }
  return aiInstance
}

export function clearAIConnection(): void {
  if (aiInstance) {
    aiInstance.disconnect()
    aiInstance = null
  }
}

export type { AISession, AIConnectionState, AIEvent, AIEventType }
