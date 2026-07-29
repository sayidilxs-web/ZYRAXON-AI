import type { AgentMode } from '../types'

const DEFAULT_SERVER = 'https://zyraxon-mobile-agent.onrender.com'
const DEFAULT_AGENT_SERVER = 'https://zyraxon-mobile-agent.onrender.com'

let serverUrl = DEFAULT_SERVER
let agentServerUrl = DEFAULT_AGENT_SERVER

export function setServerUrl(url: string) {
  serverUrl = url.replace(/\/+$/, '')
}

export function getServerUrl(): string {
  return serverUrl
}

export function setAgentServerUrl(url: string) {
  agentServerUrl = url.replace(/\/+$/, '')
}

export function getAgentServerUrl(): string {
  return agentServerUrl
}

export interface AiResponse {
  text: string
  actions: Array<{ type: string; target?: string; text?: string; x?: number; y?: number; duration?: number; description?: string }>
  finish_reason?: string
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${serverUrl}/health`, { method: 'GET', signal: AbortSignal.timeout(5000) })
    return res.ok
  } catch {
    return false
  }
}

export async function agentHealthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${agentServerUrl}/health`, { method: 'GET', signal: AbortSignal.timeout(5000) })
    return res.ok
  } catch {
    return false
  }
}

export async function streamChat(
  content: string,
  history: Array<{ role: string; content: string }>,
  agentMode: AgentMode,
  onToken: (token: string) => void,
  onDone: (response: AiResponse) => void,
  onError: (err: Error) => void,
  visionFrames?: Array<{ base64: string; timestamp: number; type: string }>,
  deviceInfo?: { platform: string; screen_width?: number; screen_height?: number; battery_level?: number; current_app?: string },
): Promise<AbortController> {
  const controller = new AbortController()

  try {
    const body: Record<string, any> = { message: content, history, mode: agentMode }
    if (visionFrames && visionFrames.length > 0) body.vision_frames = visionFrames
    if (deviceInfo) body.device_info = deviceInfo

    const res = await fetch(`${agentServerUrl}/api/mobile/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!res.ok) {
      onError(new Error(`Server error: ${res.status}`))
      return controller
    }

    const data = await res.json()
    const response: AiResponse = {
      text: data.text || '(no response)',
      actions: data.actions || [],
      finish_reason: data.finish_reason,
    }
    onToken(response.text)
    onDone(response)
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      onError(err instanceof Error ? err : new Error(String(err)))
    }
  }

  return controller
}
