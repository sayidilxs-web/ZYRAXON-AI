export type AgentMode = 'general' | 'build' | 'plan' | 'beast' | 'pro' | 'apex' | 'dark' | 'vision' | 'pro-builder'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  timestamp: number
}

export interface Session {
  id: string
  title: string
  agentMode: AgentMode
  messages: Message[]
  createdAt: number
  updatedAt: number
}
