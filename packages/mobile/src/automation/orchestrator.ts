/**
 * AI-Driven Automation Orchestrator
 *
 * Autonomous task execution loop:
 *   1. Take screenshot → send to AI
 *   2. Read UI tree → send to AI (structured element data)
 *   3. AI decides next action → "tap YouTube icon" or "scroll down"
 *   4. Execute action via AccessibilityService/ADB
 *   5. Wait for screen change
 *   6. Repeat from 1 until AI says task is complete
 *
 * This is completely autonomous - no user interaction needed.
 * AI handles: CapCut video editing, YouTube search & play,
 * messaging, app navigation, file management, etc.
 */

import { getAgentServerUrl } from '../services/api'
import { takeScreenshotBase64 } from '../mobile-agent/vision-service'
import { AutomationBackend } from './types'
import {
  initializeAndroidAutomation, shutdownAutomation,
  performTap, performSwipe, performTypeText,
  performGoBack, performGoHome, performOpenApp, performOpenUrl,
  performScrollDown, performScrollUp,
  readScreen, findAndClickByText,
  setAutomationMode, getAutomationMode,
} from './android-executor'
import { adbConnect, adbGetForegroundApp } from './adb-executor'

export type TaskStatus = 'running' | 'complete' | 'error' | 'waiting_input'

export interface TaskProgress {
  step: string
  status: TaskStatus
  message: string
  screenshot?: string
  actionCount: number
  error?: string
}

type ProgressCallback = (progress: TaskProgress) => void

export class AutomationOrchestrator {
  private running = false
  private actionCount = 0
  private readonly MAX_STEPS = 200
  private onProgress: ProgressCallback
  private abortController: AbortController | null = null

  constructor(onProgress: ProgressCallback) {
    this.onProgress = onProgress
  }

  isRunning(): boolean {
    return this.running
  }

  /**
   * Initialize the automation backend
   */
  async initialize(): Promise<boolean> {
    this.report({ step: 'init', status: 'running', message: 'Initializing automation...', actionCount: 0 })

    // Try AccessibilityService first (port 19091)
    const accAvailable = await this.checkAccessibilityService()
    if (accAvailable) {
      setAutomationMode('accessibility')
      this.report({ step: 'init', status: 'running', message: 'AccessibilityService connected ✓', actionCount: 0 })
      return true
    }

    // Fall back to ADB
    const adbOk = await initializeAndroidAutomation()
    if (adbOk) {
      this.report({ step: 'init', status: 'running', message: 'ADB connected ✓', actionCount: 0 })
      return true
    }

    this.report({ step: 'init', status: 'error', message: 'No automation backend available', actionCount: 0 })
    return false
  }

  /**
   * Execute a task autonomously with AI guidance
   *
   * @param task - User's task description (e.g., "Open CapCut, edit cat.mp4 with slow-mo effect, save")
   * @param mode - Agent mode
   */
  async executeTask(task: string, mode: string = 'general'): Promise<void> {
    if (this.running) return
    this.running = true
    this.actionCount = 0
    this.abortController = new AbortController()

    this.report({ step: 'start', status: 'running', message: `Starting task: ${task}`, actionCount: 0 })

    const history: Array<{ role: string; content: string }> = [
      {
        role: 'system',
        content: `You are ZYRAXON Mobile Automation AI. Your ONLY job is to complete this task by issuing REAL device actions.

You receive screen state (UI elements + screenshot). You respond with ONE next action.

RESPONSE FORMAT (JSON only):
{
  "analysis": "Brief description of what you see on screen",
  "thought": "What you're trying to achieve next",
  "action": {
    "type": "tap|type|scroll|swipe|open_app|go_back|go_home|wait|complete|error",
    "params": { ... }
  },
  "complete": false,
  "message": "What you're doing right now"
}

ACTION TYPES:
- tap: {"x": 500, "y": 800} or {"text": "button text"} — find element by text and tap
- type: {"text": "hello world"} — type text into focused field
- scroll: {"direction": "down|up"} — scroll
- swipe: {"x1":100, "y1":500, "x2":100, "y2":200} — swipe gesture
- open_app: {"app": "youtube|capcut|chrome|settings|..."} — open any app
- go_back: {} — back button
- go_home: {} — home button
- wait: {"ms": 2000} — wait for screen to load
- complete: {} — TASK IS DONE. Save/output the result.
- error: {"message": "what went wrong"} — report error

IMPORTANT:
- You MUST analyze the screenshot + UI elements before each action
- You MUST verify each action worked before proceeding
- If a tap didn't work, try tapping at coordinates directly
- For complex tasks, break down into MANY small steps
- KEEP GOING until the task is truly complete`,
      },
      { role: 'user', content: `Task: ${task}\n\nYou have full Android device control. Execute this task step by step. Start by looking at the screen.` },
    ]

    try {
      await this.autonomousLoop(history, mode)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        this.report({ step: 'error', status: 'error', message: err.message, actionCount: this.actionCount, error: err.message })
      }
    } finally {
      this.running = false
    }
  }

  private async autonomousLoop(
    history: Array<{ role: string; content: string }>,
    mode: string,
  ): Promise<void> {
    for (let step = 0; step < this.MAX_STEPS; step++) {
      if (!this.running || this.abortController?.signal.aborted) return

      // STEP 1: Read screen
      const screenData = await this.readCurrentScreen()
      if (!screenData) {
        await this.delay(1000)
        continue
      }

      // STEP 2: Send screen state to AI for decision
      const aiDecision = await this.queryAi(screenData, history, mode)
      if (!aiDecision) {
        await this.delay(1000)
        continue
      }

      // STEP 3: Log AI's thought
      this.report({
        step: `step_${step}`,
        status: 'running',
        message: aiDecision.message || aiDecision.analysis || 'Executing...',
        screenshot: screenData.screenshot || undefined,
        actionCount: this.actionCount,
      })

      // STEP 4: Check if task is complete
      if (aiDecision.complete) {
        this.report({ step: 'done', status: 'complete', message: aiDecision.message || 'Task complete!', actionCount: this.actionCount })
        return
      }

      // STEP 5: Execute the action
      if (aiDecision.action) {
        const success = await this.executeAiAction(aiDecision.action)
        if (!success) {
          // Retry with alternative approach
          this.report({ step: `step_${step}`, status: 'running', message: `Action failed, retrying...`, actionCount: this.actionCount })
          await this.delay(1000)
          // Try clicking center of screen as fallback
          if (aiDecision.action.type === 'tap') {
            const screenInfo = await readScreen()
            if (screenInfo.uiTree?.elements.length) {
              // Find first clickable element
              const clickable = screenInfo.uiTree.elements.find(e => e.clickable && e.bounds.width > 50)
              if (clickable) {
                await performTap(clickable.center.x, clickable.center.y)
              }
            }
          }
        }
        this.actionCount++
      }

      // STEP 6: Wait for UI to settle
      await this.delay(1500)
    }

    this.report({ step: 'max_steps', status: 'error', message: 'Reached maximum steps without completing task', actionCount: this.actionCount })
  }

  private async readCurrentScreen(): Promise<{ screenshot: string | null; uiText: string } | null> {
    try {
      const screenshot = await takeScreenshotBase64()
      const screen = await readScreen()
      return {
        screenshot,
        uiText: screen.prompt,
      }
    } catch {
      return null
    }
  }

  private async queryAi(
    screenData: { screenshot: string | null; uiText: string },
    history: Array<{ role: string; content: string }>,
    mode: string,
  ): Promise<AiDecision | null> {
    try {
      const body: any = {
        message: `[SCREEN STATE]\n${screenData.uiText}`,
        history: history.slice(-20),
        mode,
      }

      if (screenData.screenshot) {
        body.vision_frames = [{ base64: screenData.screenshot, timestamp: Date.now(), type: 'screenshot' }]
      }
      body.device_info = {}

      const res = await fetch(`${getAgentServerUrl()}/api/mobile/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
      })

      if (!res.ok) return null
      const data = await res.json()

      // Parse the AI's response to extract action decision
      return this.parseAiResponse(data.text)
    } catch {
      return null
    }
  }

  private parseAiResponse(text: string): AiDecision | null {
    try {
      // Try direct JSON parse
      const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      const parsed = JSON.parse(clean)
      if (parsed.action || parsed.complete !== undefined) {
        return parsed as AiDecision
      }
      // Try to find JSON in the text
      const match = clean.match(/\{[\s\S]*"action"[\s\S]*\}/)
      if (match) {
        return JSON.parse(match[0]) as AiDecision
      }
      return null
    } catch {
      // If AI didn't return JSON, create a type action
      return {
        analysis: text,
        action: { type: 'wait', params: { ms: 2000 } },
        complete: false,
        message: text,
      }
    }
  }

  private async executeAiAction(action: AiAction): Promise<boolean> {
    try {
      switch (action.type) {
        case 'tap': {
          if (action.params.text) {
            const result = await findAndClickByText(action.params.text)
            if (!result.success && action.params.x && action.params.y) {
              return (await performTap(action.params.x, action.params.y)).success
            }
            return result.success
          }
          if (action.params.x && action.params.y) {
            return (await performTap(action.params.x, action.params.y)).success
          }
          return false
        }
        case 'type': {
          if (action.params.text) {
            return (await performTypeText(action.params.text)).success
          }
          return false
        }
        case 'scroll': {
          if (action.params.direction === 'up') return (await performScrollUp()).success
          return (await performScrollDown()).success
        }
        case 'swipe': {
          return (await performSwipe(
            action.params.x1 ?? 500, action.params.y1 ?? 800,
            action.params.x2 ?? 500, action.params.y2 ?? 200,
            action.params.duration,
          )).success
        }
        case 'open_app': {
          return (await performOpenApp(action.params.app ?? action.params.target ?? '')).success
        }
        case 'go_back': {
          return (await performGoBack()).success
        }
        case 'go_home': {
          return (await performGoHome()).success
        }
        case 'wait': {
          await this.delay(action.params.ms ?? 2000)
          return true
        }
        case 'complete':
          return true
        case 'error':
          this.report({ step: 'error', status: 'error', message: action.params.message || 'AI reported error', actionCount: this.actionCount })
          return false
        default:
          return false
      }
    } catch (err: any) {
      return false
    }
  }

  private async checkAccessibilityService(): Promise<boolean> {
    try {
      const res = await fetch('http://127.0.0.1:19091/health', { signal: AbortSignal.timeout(2000) })
      return res.ok
    } catch {
      return false
    }
  }

  private report(progress: TaskProgress) {
    this.onProgress(progress)
  }

  abort() {
    this.running = false
    this.abortController?.abort()
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

interface AiDecision {
  analysis: string
  thought?: string
  action: AiAction
  complete: boolean
  message?: string
}

interface AiAction {
  type: 'tap' | 'type' | 'scroll' | 'swipe' | 'open_app' | 'go_back' | 'go_home' | 'wait' | 'complete' | 'error'
  params: Record<string, any>
}
