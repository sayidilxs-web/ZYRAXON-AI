import type { AgentMode } from '../types'

// OpenCode.ai free API endpoint
const OPENCODE_API_URL = 'https://opencode.ai/zen/v1/chat/completions'

// Local automation server (Helper APK)
const DEFAULT_LOCAL_SERVER = 'http://127.0.0.1:19091'

let localServerUrl = DEFAULT_LOCAL_SERVER

export function setLocalServerUrl(url: string) {
  localServerUrl = url.replace(/\/+$/, '')
}

export function getLocalServerUrl(): string {
  return localServerUrl
}

// Backwards compatibility
export function setServerUrl(url: string) {
  // No longer used
}
export function getServerUrl(): string {
  return OPENCODE_API_URL
}
export function setAgentServerUrl(url: string) {
  localServerUrl = url.replace(/\/+$/, '')
}
export function getAgentServerUrl(): string {
  return localServerUrl
}

export interface AiResponse {
  text: string
  actions: Array<{ type: string; target?: string; text?: string; x?: number; y?: number; duration?: number; description?: string }>
  finish_reason?: string
}

export async function healthCheck(): Promise<boolean> {
  try {
    // Check local automation server
    const res = await fetch(`${localServerUrl}/health`, { method: 'GET', signal: AbortSignal.timeout(5000) })
    return res.ok
  } catch {
    return false
  }
}

// Alias for backwards compatibility
export const agentHealthCheck = healthCheck

// Agent mode to model mapping
const AGENT_MODELS: Record<AgentMode, string> = {
  general: 'mimo-v2.5-free',
  build: 'mimo-v2.5-free',
  plan: 'mimo-v2.5-free',
  beast: 'big-pickle',
  pro: 'big-pickle',
  apex: 'big-pickle',
  dark: 'deepseek-v4-flash-free',
  vision: 'mimo-v2.5-free',
  'pro-builder': 'mimo-v2.5-free',
}

function buildSystemPrompt(agentMode: AgentMode, deviceInfo?: any): string {
  const modeInstructions: Record<string, string> = {
    general: 'You are a helpful mobile AI assistant. When the user asks you to control their phone (open apps, click, type, etc.), respond with a JSON object containing text and actions.',
    build: 'You are a code assistant. You can help write code, files, and explanations. When asked to control the phone for testing or demo purposes, respond with JSON actions.',
    plan: 'You are a planning assistant. Analyze requests and create detailed plans.',
    beast: 'You are a maximum capability assistant. You can do anything requested. Control the phone with confidence.',
    pro: 'You are a professional developer assistant.',
    apex: 'You are the ultimate AI assistant. You have full control over the device.',
    dark: 'You are a stealth analyst assistant.',
    vision: 'You can see the phone screen. Analyze it and control accordingly.',
    'pro-builder': 'You are an advanced builder assistant.',
  }

  const mode = modeInstructions[agentMode] || modeInstructions.general
  
  let deviceContext = ''
  if (deviceInfo) {
    deviceContext = `\n\nDevice Info: ${JSON.stringify(deviceInfo)}`
  }

  return `${mode}${deviceContext}

When controlling the phone, respond with JSON like:
{
  "text": "Opening YouTube...",
  "actions": [{"type": "open_app", "target": "youtube"}],
  "finish_reason": "working"
}

Action types:
- open_app: {"type": "open_app", "target": "youtube|chrome|whatsapp|etc"}
- click: {"type": "click", "target": "button text"}
- type: {"type": "type_text", "text": "hello"}
- swipe: {"type": "swipe", "direction": "up|down|left|right"}
- go_back: {"type": "go_back"}
- go_home: {"type": "go_home"}
- scroll: {"type": "scroll", "direction": "forward|backward"}
- screenshot: {"type": "screenshot"}
- wait: {"type": "wait", "duration": 1000}

If no action needed, respond with just text and finish_reason: "complete".`
}

function parseJsonFromReasoning(reasoning: string): { text: string; actions: any[] } | null {
  // Try to find JSON in reasoning
  const jsonMatch = reasoning.match(/\{[\s\S]*?"text"[\s\S]*?"actions"[\s\S]*?\}/)
  
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        text: parsed.text || reasoning.replace(jsonMatch[0], '').trim(),
        actions: parsed.actions || []
      }
    } catch {
      // Try with relaxed JSON parsing
      try {
        // Extract key fields manually
        const textMatch = jsonMatch[0].match(/"text"\s*:\s*"([^"]*)"/)
        const actionsMatch = jsonMatch[0].match(/"actions"\s*:\s*(\[[\s\S]*?\])/)
        
        return {
          text: textMatch ? textMatch[1] : reasoning.replace(jsonMatch[0], '').trim(),
          actions: actionsMatch ? JSON.parse(actionsMatch[1]) : []
        }
      } catch {
        // Fall through to text-only
      }
    }
  }
  
  return null
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
    const model = AGENT_MODELS[agentMode] || 'mimo-v2.5-free'
    const systemPrompt = buildSystemPrompt(agentMode, deviceInfo)
    
    // Build messages
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt }
    ]
    
    // Add history (last 10 messages)
    const recentHistory = history.slice(-10)
    for (const msg of recentHistory) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content })
      }
    }
    
    // Add vision frames as content if present
    if (visionFrames && visionFrames.length > 0) {
      const lastUserMsg = content
      const imageContent = visionFrames.map(frame => ({
        type: 'image_url' as const,
        image_url: { url: `data:image/jpeg;base64,${frame.base64}` }
      }))
      messages.push({ role: 'user', content: lastUserMsg })
      messages.push({ role: 'user', content: imageContent as any })
    } else {
      messages.push({ role: 'user', content })
    }

    const body = {
      model,
      messages,
      max_tokens: 4096,
      stream: false
    }

    const res = await fetch(OPENCODE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!res.ok) {
      const errorText = await res.text()
      onError(new Error(`OpenCode API error (${res.status}): ${errorText}`))
      return controller
    }

    const data = await res.json()
    
    // Get reasoning from the response
    const reasoning = data.choices?.[0]?.message?.reasoning || ''
    
    // Parse JSON from reasoning
    const parsed = parseJsonFromReasoning(reasoning)
    
    let response: AiResponse
    if (parsed) {
      response = {
        text: parsed.text || '(no response)',
        actions: parsed.actions || [],
        finish_reason: parsed.actions.length > 0 ? 'working' : 'complete'
      }
    } else {
      // Use the reasoning as text
      response = {
        text: reasoning || '(no response)',
        actions: [],
        finish_reason: 'complete'
      }
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
