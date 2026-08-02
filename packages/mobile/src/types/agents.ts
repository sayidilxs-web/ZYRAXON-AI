import { theme } from './theme'

export type AgentMode = 'general' | 'build' | 'plan' | 'beast' | 'pro' | 'apex' | 'dark' | 'vision' | 'pro-builder'

export interface AgentModeInfo {
  name: string
  color: string
  description: string
  icon: string
}

export const AGENT_MODES: Record<AgentMode, AgentModeInfo> = {
  general: { name: 'General', color: theme.primary, description: 'Default mode', icon: '💬' },
  build: { name: 'Build', color: '#22c55e', description: 'Build mode', icon: '🔨' },
  plan: { name: 'Plan', color: '#f59e0b', description: 'Plan mode', icon: '📋' },
  beast: { name: 'Beast', color: '#ef4444', description: 'Beast mode', icon: '🦁' },
  pro: { name: 'Pro', color: '#3b82f6', description: 'Pro mode', icon: '⭐' },
  apex: { name: 'Apex', color: '#a855f7', description: 'Apex mode', icon: '🦅' },
  dark: { name: 'Dark', color: '#000000', description: 'Dark mode', icon: '🌑' },
  vision: { name: 'Vision', color: '#ec4899', description: 'Vision mode', icon: '👁️' },
  'pro-builder': { name: 'Pro Builder', color: '#14b8a6', description: 'Pro Builder mode', icon: '🏗️' },
}

export const AGENT_MODE_LIST: AgentMode[] = Object.keys(AGENT_MODES) as AgentMode[]
