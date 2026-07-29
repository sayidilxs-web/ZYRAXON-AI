import { getAgentServerUrl } from '../services/api'
import { executeAction } from './action-executor'
import { takeScreenshot, getScreenDimensions, getPlatformInfo } from './vision-service'
import type { AgentRequest, AgentResponse, DeviceAction, AgentEvent } from './protocol'

type EventCallback = (event: AgentEvent) => void

export class MobileAgentEngine {
  private onEvent: EventCallback
  private running = false
  private autoScreenshotInterval: ReturnType<typeof setInterval> | null = null

  constructor(onEvent: EventCallback) {
    this.onEvent = onEvent
  }

  isRunning(): boolean {
    return this.running
  }

  async sendMessage(
    text: string,
    history: Array<{ role: string; content: string }>,
    mode: string,
    includeVision = false,
  ): Promise<string> {
    this.running = true

    let visionFrames = undefined
    if (includeVision) {
      this.onEvent({ type: 'screenshot_taken', base64: '' })
      const frame = await takeScreenshot()
      if (frame) {
        visionFrames = [frame]
      }
    }

    const request: AgentRequest = {
      message: text,
      history,
      mode,
      vision_frames: visionFrames,
      device_info: {
        ...getPlatformInfo(),
      },
    }

    try {
      const res = await fetch(`${getAgentServerUrl()}/api/mobile/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error')
        throw new Error(`Agent error (${res.status}): ${errText}`)
      }

      const response: AgentResponse = await res.json()
      await this.processResponse(response)
      return response.text
    } catch (err: any) {
      this.onEvent({ type: 'error', message: err.message })
      return `Error: ${err.message}`
    } finally {
      this.running = false
    }
  }

  private async processResponse(response: AgentResponse): Promise<void> {
    if (response.should_screenshot) {
      this.onEvent({ type: 'screenshot_taken', base64: '' })
      const frame = await takeScreenshot()
      if (frame) {
        this.onEvent(frame)
      }
    }

    if (response.actions && response.actions.length > 0) {
      for (const action of response.actions) {
        const result = await executeAction(action)
        this.onEvent({
          type: 'action_result',
          action,
          success: result.success,
          error: result.error,
        })
      }
    }

    if (response.should_speak) {
      this.onEvent({ type: 'voice_input', text: response.text })
    }
  }

  startAutoScreenshot(intervalMs = 3000): void {
    this.stopAutoScreenshot()
    this.autoScreenshotInterval = setInterval(async () => {
      const frame = await takeScreenshot()
      if (frame) {
        this.onEvent(frame)
      }
    }, intervalMs)
  }

  stopAutoScreenshot(): void {
    if (this.autoScreenshotInterval) {
      clearInterval(this.autoScreenshotInterval)
      this.autoScreenshotInterval = null
    }
  }
}
