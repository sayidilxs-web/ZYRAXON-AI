import type { Message } from '../types'

export interface AiResponse {
  id: string
  content: string
  done: boolean
}

export async function streamChat(
  messages: Message[],
  onChunk: (text: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void,
  abortSignal?: AbortSignal
): Promise<void> {
  try {
    console.log('streamChat called with', messages.length, 'messages')
    onChunk('This is a stub response from the mobile app.')
    onComplete()
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)))
  }
}

export async function healthCheck(): Promise<boolean> {
  return true
}

let agentServerUrl = 'http://localhost:4096'

export function getAgentServerUrl(): string {
  return agentServerUrl
}

export function setAgentServerUrl(url: string): void {
  agentServerUrl = url
}
