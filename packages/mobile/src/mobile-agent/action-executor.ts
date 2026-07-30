import type { DeviceAction } from './protocol'

let initialized = false

export async function ensureInitialized(): Promise<void> {
  if (!initialized) {
    console.log('Mobile agent: ensuring initialized')
    initialized = true
  }
}

export async function executeAction(action: DeviceAction): Promise<{ success: boolean; result?: unknown }> {
  console.log('Mobile agent: executing action', action)
  return { success: true }
}

export async function executeActionBatch(actions: DeviceAction[]): Promise<{ success: boolean; results?: unknown[] }> {
  console.log('Mobile agent: executing batch of', actions.length, 'actions')
  const results = await Promise.all(actions.map(a => executeAction(a)))
  return { success: true, results: results.map(r => r.result) }
}

export async function takeScreenshotBase64(): Promise<string> {
  console.log('Mobile agent: taking screenshot')
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
}
