import type { AgentMode, AgentModeConfig } from '.'

export const AGENT_MODES: Record<AgentMode, AgentModeConfig> = {
  build: {
    id: 'build',
    label: 'Build',
    color: '#22c55e',
    gradient: ['#22c55e', '#16a34a'] as const,
    icon: 'hammer',
    description: 'Build and generate code',
  },
  plan: {
    id: 'plan',
    label: 'Plan',
    color: '#3b82f6',
    gradient: ['#3b82f6', '#2563eb'] as const,
    icon: 'clipboard-list',
    description: 'Plan and architect solutions',
  },
  beast: {
    id: 'beast',
    label: 'Beast',
    color: '#f97316',
    gradient: ['#f97316', '#ea580c'] as const,
    icon: 'zap',
    description: 'Maximum output mode',
  },
  pro: {
    id: 'pro',
    label: 'PRO',
    color: '#a855f7',
    gradient: ['#a855f7', '#9333ea'] as const,
    icon: 'star',
    description: 'Professional coding mode',
  },
  apex: {
    id: 'apex',
    label: 'APEX PREDATOR',
    color: '#ef4444',
    gradient: ['#ef4444', '#dc2626'] as const,
    icon: 'flame',
    description: 'Ultimate power mode',
  },
  dark: {
    id: 'dark',
    label: 'DARK EMPEROR',
    color: '#6b7280',
    gradient: ['#6b7280', '#4b5563'] as const,
    icon: 'moon',
    description: 'Stealth analysis mode',
  },
  vision: {
    id: 'vision',
    label: 'Vision',
    color: '#06b6d4',
    gradient: ['#06b6d4', '#0891b2'] as const,
    icon: 'eye',
    description: 'Visual analysis mode',
  },
  'pro-builder': {
    id: 'pro-builder',
    label: 'Pro Builder',
    color: '#f59e0b',
    gradient: ['#f59e0b', '#d97706'] as const,
    icon: 'wrench',
    description: 'Advanced builder mode',
  },
  general: {
    id: 'general',
    label: 'General',
    color: '#8b5cf6',
    gradient: ['#8b5cf6', '#7c3aed'] as const,
    icon: 'bot',
    description: 'General assistant mode',
  },
}

export const AGENT_MODE_LIST = Object.values(AGENT_MODES)
