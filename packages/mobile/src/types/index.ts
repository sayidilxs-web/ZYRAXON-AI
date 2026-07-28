export type AgentMode = 'build' | 'plan' | 'beast' | 'pro' | 'apex' | 'dark' | 'vision' | 'pro-builder' | 'general'

export interface AgentModeConfig {
  id: AgentMode
  label: string
  color: string
  gradient: readonly [string, string]
  icon: string
  description: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export interface Session {
  id: string
  title: string
  messages: Message[]
  agentMode: AgentMode
  createdAt: number
  updatedAt: number
}

export interface ApiConfig {
  serverUrl: string
  apiKey?: string
}

export interface AutomationAction {
  type: 'open' | 'click' | 'type' | 'scroll' | 'screenshot'
  target?: string
  text?: string
  x?: number
  y?: number
}
