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
    // Try AccessibilityService
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

  try {
    switch (action.type) {
      case 'click':
        return executeClick(action)
      case 'double_click':
        return executeDoubleClick(action)
      case 'long_press':
        return executeLongPress(action)
      case 'type_text':
        return executeTypeText(action)
      case 'paste_text':
        return executePasteText(action)
      case 'scroll_down':
        return executeScrollDown()
      case 'scroll_up':
        return executeScrollUp()
      case 'swipe_left':
        return executeSwipe('left')
      case 'swipe_right':
        return executeSwipe('right')
      case 'open_app':
        return executeOpenApp(action)
      case 'open_url':
        return executeOpenUrl(action)
      case 'go_back':
        return executeGoBack()
      case 'go_home':
        return executeGoHome()
      case 'open_recents':
        return executeOpenRecents()
      case 'notification_tap':
        return executeNotificationTap(action)
      case 'screenshot':
        return { success: true }
      case 'start_voice':
      case 'stop_voice':
        return { success: true }
      case 'start_camera':
      case 'stop_camera':
        return { success: true }
      case 'vibrate':
        return executeVibrate(action)
      case 'speak_text':
        return executeSpeak(action)
      case 'set_volume':
        return executeSetVolume()
      case 'wait':
        return executeWait(action)
      default:
        return { success: false, error: `Unknown action: ${action.type}` }
    }
  } catch (err: any) {
    return { success: false, error: err?.message ?? String(err) }
  }
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
