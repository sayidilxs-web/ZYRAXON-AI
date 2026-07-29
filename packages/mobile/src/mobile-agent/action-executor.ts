import { Platform, Vibration, BackHandler } from 'react-native'
import { Linking } from 'react-native'
import * as Speech from 'expo-speech'
import { APP_PACKAGES } from '../automation/adb-executor'
import {
  initializeAndroidAutomation, shutdownAutomation,
  performTap, performSwipe, performTypeText,
  performGoBack, performGoHome, performOpenRecents,
  performOpenApp, performOpenUrl,
  performScrollDown, performScrollUp,
  performNotificationTap,
  readScreen, findAndClickByText,
  setAutomationMode,
} from '../automation/android-executor'
import { adbPressKey, KEYCODE, adbConnect, adbGetForegroundApp } from '../automation/adb-executor'
import type { DeviceAction } from './protocol'
import type { ActionResult } from '../automation/types'

let initialized = false

export async function ensureInitialized(): Promise<boolean> {
  if (initialized) return true
  if (Platform.OS === 'android') {
    initialized = await initializeAndroidAutomation()
    try {
      const res = await fetch('http://127.0.0.1:19091/health', { signal: AbortSignal.timeout(1000) })
      if (res.ok) {
        setAutomationMode('accessibility')
      }
    } catch {}
    return initialized
  }
  return false
}

export async function executeAction(action: DeviceAction): Promise<ActionResult> {
  const start = Date.now()
  await ensureInitialized()

  let lastError: string | undefined
  const maxRetries = action.type === 'click' || action.type === 'open_app' ? 3 : 2

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let result: ActionResult = { success: false, error: 'Unknown action' }

      switch (action.type) {
        case 'click':
          result = await executeClick(action)
          break
        case 'double_click':
          result = await executeDoubleClick(action)
          break
        case 'long_press':
          result = await executeLongPress(action)
          break
        case 'type_text':
          result = await executeTypeText(action)
          break
        case 'paste_text':
          result = await executePasteText(action)
          break
        case 'scroll_down':
          result = await executeScrollDown()
          break
        case 'scroll_up':
          result = await executeScrollUp()
          break
        case 'swipe_left':
          result = await executeSwipe('left')
          break
        case 'swipe_right':
          result = await executeSwipe('right')
          break
        case 'open_app':
          result = await executeOpenApp(action)
          break
        case 'open_url':
          result = await executeOpenUrl(action)
          break
        case 'go_back':
          result = await executeGoBack()
          break
        case 'go_home':
          result = await executeGoHome()
          break
        case 'open_recents':
          result = await executeOpenRecents()
          break
        case 'notification_tap':
          result = await executeNotificationTap(action)
          break
        case 'screenshot':
          result = await executeScreenshot()
          break
        case 'start_voice':
          result = await executeStartVoice()
          break
        case 'stop_voice':
          result = await executeStopVoice()
          break
        case 'start_camera':
          result = await executeStartCamera()
          break
        case 'stop_camera':
          result = await executeStopCamera()
          break
        case 'vibrate':
          result = await executeVibrate(action)
          break
        case 'speak_text':
          result = await executeSpeak(action)
          break
        case 'set_volume':
          result = await executeSetVolume()
          break
        case 'wait':
          result = await executeWait(action)
          break
      }

      if (result.success) return { ...result, executionTime: (result.executionTime ?? 0) + (Date.now() - start) }
      lastError = result.error
      if (attempt < maxRetries) await new Promise((r) => setTimeout(r, attempt * 500))
    } catch (err: any) {
      lastError = err?.message ?? String(err)
      if (attempt < maxRetries) await new Promise((r) => setTimeout(r, attempt * 500))
    }
  }

  return { success: false, error: lastError ?? 'Max retries exceeded', executionTime: Date.now() - start }
}

export async function executeActionBatch(actions: DeviceAction[]): Promise<ActionResult[]> {
  const results: ActionResult[] = []
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i]
    results.push(await executeAction(action))
    if (i < actions.length - 1) await new Promise((r) => setTimeout(r, action.duration ?? 800))
  }
  return results
}

const INDEPENDENT_TYPES = new Set(['wait', 'vibrate', 'speak_text', 'set_volume', 'screenshot'])

export async function executeActionParallel(actions: DeviceAction[]): Promise<ActionResult[]> {
  const canParallel = actions.every((a) => INDEPENDENT_TYPES.has(a.type))
  if (canParallel) return Promise.all(actions.map(executeAction))
  return executeActionBatch(actions)
}

async function executeClick(action: DeviceAction): Promise<ActionResult> {
  // Priority 1: Find and click by text
  if (action.target) {
    const result = await findAndClickByText(action.target)
    if (result.success) return { success: true, error: result.error, executionTime: result.executionTime }
  }
  // Priority 2: Click at coordinates
  if (action.x !== undefined && action.y !== undefined) {
    return performTap(action.x, action.y)
  }
  return { success: false, error: 'No target or coordinates' }
}

async function executeDoubleClick(action: DeviceAction): Promise<ActionResult> {
  if (action.x !== undefined && action.y !== undefined) {
    await performTap(action.x, action.y)
    await new Promise((r) => setTimeout(r, 100))
    return performTap(action.x, action.y)
  }
  return { success: false, error: 'No coordinates' }
}

async function executeLongPress(action: DeviceAction): Promise<ActionResult> {
  // Long press via ADB (touch down + hold)
  if (action.x !== undefined && action.y !== undefined) {
    return performSwipe(action.x, action.y, action.x + 1, action.y + 1, 800)
  }
  return { success: false, error: 'No coordinates' }
}

async function executeTypeText(action: DeviceAction): Promise<ActionResult> {
  if (!action.text) return { success: false, error: 'No text' }
  if (Platform.OS === 'android') {
    return performTypeText(action.text)
  }
  // iOS fallback: copy to clipboard
  try {
    const clipboard = await import('expo-clipboard')
    await clipboard.setClipboardAsync(action.text)
    return { success: true }
  } catch {
    return { success: false, error: 'Cannot type on this platform' }
  }
}

async function executePasteText(action: DeviceAction): Promise<ActionResult> {
  try {
    const clipboard = await import('expo-clipboard')
    if (action.text) await clipboard.setClipboardAsync(action.text)
    return { success: true }
  } catch {
    return { success: false, error: 'Clipboard unavailable' }
  }
}

async function executeScrollDown(): Promise<ActionResult> {
  if (Platform.OS === 'android') return performScrollDown()
  return { success: true }
}

async function executeScrollUp(): Promise<ActionResult> {
  if (Platform.OS === 'android') return performScrollUp()
  return { success: true }
}

async function executeSwipe(direction: string): Promise<ActionResult> {
  if (Platform.OS === 'android') {
    if (direction === 'left') return performSwipe(800, 600, 200, 600, 200)
    if (direction === 'right') return performSwipe(200, 600, 800, 600, 200)
  }
  return { success: true }
}

async function executeOpenApp(action: DeviceAction): Promise<ActionResult> {
  const target = action.target?.toLowerCase() ?? ''

  // Try Android automation first
  if (Platform.OS === 'android') {
    const result = await performOpenApp(target)
    if (result.success) return result

    // Try as package name directly
    const pkg = APP_PACKAGES[target]
    if (pkg) {
      return performOpenApp(pkg)
    }
    return result
  }

  // iOS: Use URL schemes
  const schemes: Record<string, string> = {
    youtube: 'youtube://',
    chrome: 'googlechrome://',
    whatsapp: 'whatsapp://',
    gmail: 'googlegmail://',
    maps: 'maps://',
    twitter: 'twitter://',
    instagram: 'instagram://',
    facebook: 'fb://',
    settings: 'app-settings:',
  }
  const scheme = schemes[target]
  if (scheme) {
    const supported = await Linking.canOpenURL(scheme)
    if (supported) { await Linking.openURL(scheme); return { success: true } }
  }
  return { success: false, error: `Cannot open ${target}` }
}

async function executeOpenUrl(action: DeviceAction): Promise<ActionResult> {
  const url = action.target ?? action.text ?? ''
  if (!url) return { success: false, error: 'No URL' }
  if (Platform.OS === 'android') {
    return performOpenUrl(url)
  }
  const fullUrl = url.startsWith('http') ? url : `https://${url}`
  const supported = await Linking.canOpenURL(fullUrl)
  if (supported) { await Linking.openURL(fullUrl); return { success: true } }
  return { success: false, error: `Cannot open ${url}` }
}

async function executeGoBack(): Promise<ActionResult> {
  if (Platform.OS === 'android') return performGoBack()
  return { success: true }
}

async function executeGoHome(): Promise<ActionResult> {
  if (Platform.OS === 'android') return performGoHome()
  BackHandler.exitApp()
  return { success: true }
}

async function executeOpenRecents(): Promise<ActionResult> {
  if (Platform.OS === 'android') return performOpenRecents()
  return { success: true }
}

async function executeNotificationTap(_action: DeviceAction): Promise<ActionResult> {
  if (Platform.OS === 'android') return performNotificationTap()
  return { success: true }
}

async function executeVibrate(action: DeviceAction): Promise<ActionResult> {
  Vibration.vibrate(action.duration ?? 200)
  return { success: true }
}

async function executeSpeak(action: DeviceAction): Promise<ActionResult> {
  if (!action.text) return { success: false, error: 'No text' }
  await Speech.speak(action.text, { rate: 0.9 })
  return { success: true }
}

async function executeSetVolume(): Promise<ActionResult> {
  if (Platform.OS === 'android') {
    await adbPressKey(KEYCODE.VOLUME_UP)
    return { success: true }
  }
  return { success: true }
}

async function executeWait(action: DeviceAction): Promise<ActionResult> {
  await new Promise((r) => setTimeout(r, action.duration ?? 1000))
  return { success: true }
}

async function executeScreenshot(): Promise<ActionResult> {
  if (Platform.OS === 'android') {
    try {
      const res = await fetch('http://127.0.0.1:19091/screenshot', { signal: AbortSignal.timeout(5000) })
      if (res.ok) {
        const data = await res.json()
        globalThis._lastScreenshotBase64 = data.base64
        return { success: true, executionTime: 500 }
      }
    } catch {}
    return { success: false, error: 'Screenshot via accessibility failed' }
  }
  return { success: false, error: 'Screenshot not supported on this platform' }
}

async function executeStartVoice(): Promise<ActionResult> {
  try {
    const speech = await import('../services/voice-service')
    await speech.voiceService.startListening()
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message }
  }
}

async function executeStopVoice(): Promise<ActionResult> {
  try {
    const speech = await import('../services/voice-service')
    await speech.voiceService.stopListening()
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message }
  }
}

async function executeStartCamera(): Promise<ActionResult> {
  try {
    const camera = await import('../services/camera-service')
    const granted = await camera.requestCameraPermission()
    if (!granted) return { success: false, error: 'Camera permission denied' }
    await camera.ensureFrameDir()
    return { success: true }
  } catch {
    return { success: false, error: 'Camera service not available' }
  }
}

async function executeStopCamera(): Promise<ActionResult> {
  return { success: true }
}

export async function takeScreenshotBase64(): Promise<string | null> {
  if (Platform.OS === 'android') {
    try {
      const res = await fetch('http://127.0.0.1:19091/screenshot', { signal: AbortSignal.timeout(5000) })
      if (res.ok) {
        const data = await res.json()
        return data.base64 ?? null
      }
    } catch {}
  }
  return null
}

export async function getForegroundApp(): Promise<string | null> {
  if (Platform.OS === 'android') {
    try {
      const res = await fetch('http://127.0.0.1:19091/foreground-app', { signal: AbortSignal.timeout(2000) })
      if (res.ok) {
        const data = await res.json()
        return data.app
      }
    } catch {}
    try {
      return await adbGetForegroundApp()
    } catch {}
  }
  return null
}
