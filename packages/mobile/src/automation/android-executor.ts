import { Platform } from 'react-native'
import { AutomationBackend } from './types'
import { adbTap, adbSwipe, adbTypeText, adbPressKey, adbOpenApp, adbScreenshot, adbGetUiTree, adbConnect, adbDisconnect, KEYCODE, APP_PACKAGES } from './adb-executor'
import { parseXmlToUiTree, uiTreeToPrompt, type ScreenState } from './screen-reader'
import type { ActionResult } from './types'

/**
 * Android Executor - Unified automation backend
 *
 * Uses AccessibilityService (preferred) with ADB fallback.
 * Provides a unified interface for device control regardless of backend.
 */

type AutomationMode = 'accessibility' | 'adb' | 'disabled'

let mode: AutomationMode = 'disabled'
let pendingUiTree: ScreenState | null = null

export function setAutomationMode(m: AutomationMode) {
  mode = m
}

export function getAutomationMode(): AutomationMode {
  return mode
}

export async function initializeAndroidAutomation(): Promise<boolean> {
  if (Platform.OS !== 'android') return false

  // Try AccessibilityService first, fall back to ADB
  mode = 'adb'
  const connected = await adbConnect()
  if (!connected) {
    mode = 'disabled'
    return false
  }
  return true
}

export async function shutdownAutomation(): Promise<void> {
  if (mode === 'adb') {
    await adbDisconnect()
  }
  mode = 'disabled'
}

export async function performTap(x: number, y: number): Promise<ActionResult> {
  if (mode === 'adb' || mode === 'accessibility') {
    return adbTap(x, y)
  }
  return { success: false, error: 'Automation not initialized' }
}

export async function performSwipe(x1: number, y1: number, x2: number, y2: number, duration?: number): Promise<ActionResult> {
  if (mode === 'adb' || mode === 'accessibility') {
    return adbSwipe(x1, y1, x2, y2, duration)
  }
  return { success: false, error: 'Automation not initialized' }
}

export async function performTypeText(text: string): Promise<ActionResult> {
  if (mode === 'adb' || mode === 'accessibility') {
    return adbTypeText(text)
  }
  return { success: false, error: 'Automation not initialized' }
}

export async function performGoBack(): Promise<ActionResult> {
  return adbPressKey(KEYCODE.BACK)
}

export async function performGoHome(): Promise<ActionResult> {
  return adbPressKey(KEYCODE.HOME)
}

export async function performOpenRecents(): Promise<ActionResult> {
  return adbPressKey(KEYCODE.RECENT_APPS)
}

export async function performOpenApp(appNameOrPackage: string): Promise<ActionResult> {
  const pkg = APP_PACKAGES[appNameOrPackage.toLowerCase()] ?? appNameOrPackage
  return adbOpenApp(pkg)
}

export async function performOpenUrl(url: string): Promise<ActionResult> {
  // Open URL via chrome
  const chromePkg = APP_PACKAGES.chrome
  const fullUrl = url.startsWith('http') ? url : `https://${url}`
  return adbOpenApp(chromePkg, 'com.google.android.apps.chrome.Main')
}

export async function performScrollDown(): Promise<ActionResult> {
  return adbSwipe(500, 1200, 500, 400, 300)
}

export async function performScrollUp(): Promise<ActionResult> {
  return adbSwipe(500, 400, 500, 1200, 300)
}

/**
 * Read current screen state
 * Returns structured UI tree + raw text from screen
 */
export async function readScreen(): Promise<{ uiTree: ScreenState | null; screenshot: string | null; prompt: string }> {
  let uiTree: ScreenState | null = null
  let screenshot: string | null = null

  if (mode === 'adb') {
    const xml = await adbGetUiTree()
    if (xml) {
      uiTree = parseXmlToUiTree(xml)
    }
    screenshot = await adbScreenshot()
  }

  // Also try screenshot via MediaProjection API (from react native)
  if (!screenshot) {
    try {
      const { takeScreenshotBase64 } = await import('../mobile-agent/vision-service')
      screenshot = await takeScreenshotBase64()
    } catch {}
  }

  const uiPrompt = uiTree ? uiTreeToPrompt(uiTree) : 'Screen UI not available'
  return { uiTree, screenshot, prompt: uiPrompt }
}

/**
 * Find element by text on screen and click it
 * The AI determines what to click based on text content
 */
export async function findAndClickByText(text: string, partial = true): Promise<ActionResult> {
  const { uiTree } = await readScreen()
  if (!uiTree) return { success: false, error: 'Cannot read screen' }

  const matchLower = text.toLowerCase()
  let bestMatch: any = null

  for (const el of uiTree.elements) {
    const elText = (el.text || el.content_description || '').toLowerCase()
    if (partial ? elText.includes(matchLower) : elText === matchLower) {
      if (el.clickable && el.bounds.width > 0) {
        bestMatch = el
        break
      }
    }
  }

  if (bestMatch) {
    return performTap(bestMatch.center.x, bestMatch.center.y)
  }

  // If not found by text, return available elements for AI to choose
  const available = uiTree.elements
    .filter((e) => e.clickable && (e.text || e.content_description))
    .slice(0, 20)
    .map((e) => `"${e.text || e.content_description}" at (${e.center.x}, ${e.center.y})`)

  return {
    success: false,
    error: `Element "${text}" not found. Available: ${available.join('; ')}`,
  }
}

export async function performNotificationTap(): Promise<ActionResult> {
  // Open notification shade
  await adbPressKey(KEYCODE.NOTIFICATION)
  return { success: true }
}
