import type { AgentMode } from '../types'

const DEFAULT_SERVER = 'http://localhost:8080'
const DEFAULT_AGENT_SERVER = 'http://localhost:3001'

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
  onDone: () => void,
  onError: (err: Error) => void,
): Promise<AbortController> {
  const controller = new AbortController()

  try {
    const res = await fetch(`${serverUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: content, history, mode: agentMode }),
      signal: controller.signal,
    })

    if (!res.ok) {
      onError(new Error(`Server error: ${res.status}`))
      return controller
    }

    const reader = res.body?.getReader()
    if (!reader) {
      onError(new Error('No response body'))
      return controller
    }

    const decoder = new TextDecoder()
    function pump(): Promise<void> {
      return reader!.read().then(({ done, value }) => {
        if (done) {
          onDone()
          return
        }
        const text = decoder.decode(value, { stream: true })
        onToken(text)
        return pump()
      })
    }
    pump().catch(onError)
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      onError(err instanceof Error ? err : new Error(String(err)))
    }
  }

  return controller
}
