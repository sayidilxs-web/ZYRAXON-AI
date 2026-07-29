import { Platform } from 'react-native'
import type { ActionResult } from './types'

/**
 * ADB (Android Debug Bridge) Executor
 *
 * Connects to Android device over TCP/IP (Wireless Debugging).
 * Uses ADB commands for REAL device control:
 *   - input tap x y         → REAL touch at coordinates
 *   - input swipe x1 y1 x2 y2 → REAL swipe/scroll
 *   - input text "string"   → REAL keyboard input
 *   - am start -n pkg/act   → Open any app by package
 *   - input keyevent KEYCODE → System keys (back, home, recents)
 *
 * REQUIREMENTS:
 *   - Android 11+ with Wireless Debugging enabled
 *   - Pair once via "adb pair ip:port" from laptop, or
 *   - Use "adb connect ip:port" after enabling Wireless Debugging
 *   - Or: USB Debugging connected
 *
 * SETUP (ONE-TIME, from laptop):
 *   adb pair 192.168.x.x:xxxxx    # shown in Developer options
 *   adb connect 192.168.x.x:xxxxx  # after pairing
 *   adb tcpip 5555                 # persist TCP mode
 */

let adbConnected = false
let deviceIp = '127.0.0.1'
let devicePort = 5555

// This module uses a local HTTP bridge (adb-proxy-server.js)
// Instead of running ADB directly from RN (which isn't possible),
// we communicate with a Node.js proxy that has ADB access.
const PROXY_URL = 'http://127.0.0.1:19090'

export function configureAdb(ip: string, port: number) {
  deviceIp = ip
  devicePort = port
}

async function adbCommand(command: string): Promise<{ stdout: string; stderr: string }> {
  try {
    const res = await fetch(`${PROXY_URL}/adb`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command,
        device: `${deviceIp}:${devicePort}`,
        platform: Platform.OS,
      }),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) throw new Error(`ADB proxy error: ${res.status}`)
    return await res.json()
  } catch (err: any) {
    return { stdout: '', stderr: err.message }
  }
}

export async function adbConnect(): Promise<boolean> {
  if (adbConnected) return true
  // Try direct ADB connect via proxy
  const result = await adbCommand(`connect ${deviceIp}:${devicePort}`)
  adbConnected = !result.stderr || result.stderr.includes('already connected')
  return adbConnected
}

export async function adbDisconnect(): Promise<void> {
  await adbCommand(`disconnect ${deviceIp}:${devicePort}`)
  adbConnected = false
}

export async function adbTap(x: number, y: number): Promise<ActionResult> {
  const start = Date.now()
  const result = await adbCommand(`shell input tap ${Math.round(x)} ${Math.round(y)}`)
  return {
    success: !result.stderr,
    error: result.stderr || undefined,
    executionTime: Date.now() - start,
  }
}

export async function adbSwipe(x1: number, y1: number, x2: number, y2: number, durationMs = 300): Promise<ActionResult> {
  const start = Date.now()
  const result = await adbCommand(
    `shell input swipe ${Math.round(x1)} ${Math.round(y1)} ${Math.round(x2)} ${Math.round(y2)} ${durationMs}`,
  )
  return {
    success: !result.stderr,
    error: result.stderr || undefined,
    executionTime: Date.now() - start,
  }
}

export async function adbTypeText(text: string): Promise<ActionResult> {
  const start = Date.now()
  // Escape special characters for shell
  const escaped = text.replace(/"/g, '\\"').replace(/'/g, "\\'").replace(/`/g, '\\`').replace(/\$/g, '\\$')
  const result = await adbCommand(`shell input text "${escaped}"`)
  return {
    success: !result.stderr,
    error: result.stderr || undefined,
    executionTime: Date.now() - start,
  }
}

export async function adbPressKey(keyCode: number): Promise<ActionResult> {
  const start = Date.now()
  const result = await adbCommand(`shell input keyevent ${keyCode}`)
  return {
    success: !result.stderr,
    error: result.stderr || undefined,
    executionTime: Date.now() - start,
  }
}

export async function adbOpenApp(packageName: string, activity?: string): Promise<ActionResult> {
  const start = Date.now()
  const target = activity ? `${packageName}/${activity}` : `${packageName}/.MainActivity`
  const result = await adbCommand(`shell am start -n ${target}`)
  return {
    success: !result.stderr,
    error: result.stderr || undefined,
    executionTime: Date.now() - start,
  }
}

export async function adbScreenshot(): Promise<string | null> {
  const result = await adbCommand(`shell screencap -p /sdcard/screen.png`)
  if (result.stderr) return null
  const pullResult = await adbCommand(`pull /sdcard/screen.png -`)
  if (pullResult.stderr) return null
  // Base64 encode the binary data
  try {
    const res = await fetch(`${PROXY_URL}/screenshot`, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null
    const data = await res.json()
    return data.base64 as string
  } catch {
    return null
  }
}

export async function adbGetUiTree(): Promise<string | null> {
  // Uses Android's uiautomator dump (requires AccessibilityService or uiautomator)
  const result = await adbCommand(`shell uiautomator dump /sdcard/ui.xml`)
  if (result.stderr) return null
  const pullResult = await adbCommand(`shell cat /sdcard/ui.xml`)
  return pullResult.stdout || null
}

export async function adbGetForegroundApp(): Promise<string | null> {
  const result = await adbCommand(`shell dumpsys window windows | grep -E 'mCurrentFocus|mFocusedApp'`)
  if (result.stderr) return null
  const match = result.stdout.match(/([a-zA-Z0-9_.]+\/[a-zA-Z0-9_.]+)/)
  return match?.[1] ?? null
}

// KeyEvent constants
export const KEYCODE = {
  HOME: 3,
  BACK: 4,
  CALL: 5,
  ENDCALL: 6,
  VOLUME_UP: 24,
  VOLUME_DOWN: 25,
  POWER: 26,
  CAMERA: 27,
  CLEAR: 28,
  ENTER: 66,
  DEL: 67,
  MENU: 82,
  SEARCH: 84,
  RECENT_APPS: 185,
  NOTIFICATION: 83,
  SETTINGS: 176,
  SWITCH_KEYBOARD: 287,
} as const

// Common app package names - All popular apps
export const APP_PACKAGES: Record<string, string> = {
  // Google
  youtube: 'com.google.android.youtube',
  chrome: 'com.android.chrome',
  gmail: 'com.google.android.gm',
  maps: 'com.google.android.apps.maps',
  photos: 'com.google.android.apps.photos',
  drive: 'com.google.android.apps.docs',
  docs: 'com.google.android.apps.docs.editors.docs',
  sheets: 'com.google.android.apps.docs.editors.sheets',
  calendar: 'com.google.android.calendar',
  clock: 'com.google.android.deskclock',
  camera: 'com.google.android.GoogleCamera',
  assistant: 'com.google.android.googlequicksearchbox',
  gemini: 'com.google.android.apps.gemini',
  playstore: 'com.android.vending',
  
  // Social Media
  whatsapp: 'com.whatsapp',
  instagram: 'com.instagram.android',
  facebook: 'com.facebook.katana',
  messenger: 'com.facebook.orca',
  twitter: 'com.twitter.android',
  tiktok: 'com.zhiliaoapp.musically',
  snapchat: 'com.snapchat.android',
  pinterest: 'com.pinterest',
  reddit: 'com.reddit.frontpage',
  linkedin: 'com.linkedin.android',
  
  // Messaging
  telegram: 'org.telegram.messenger',
  viber: 'com.viber.voip',
  imo: 'com.imo.android.imou',
  signal: 'org.thoughtcrime.securesms',
  skype: 'com.skype.raider',
  
  // Video/Media
  netflix: 'com.netflix.mediaclient',
  prime: 'com.amazon.avod.thirdpartyclient',
  disney: 'com.disney.disneyplus',
  hotstar: 'in.startv.hotstar',
  jio: 'com.jio.media.jiobeats',
  spotify: 'com.spotify.music',
  youtube_music: 'com.google.android.apps.youtube.music',
  
  // Gaming
  freefire: 'com.dts.freefireth',
  pubg: 'com.tencent.ig',
  cod: 'com.activision.callofduty.warzone',
  minecraft: 'com.mojang.minecraftpe',
  
  // Shopping
  amazon: 'com.amazon.mShop.android.shopping',
  flipkart: 'com.flipkart.android',
  daraz: 'com.daraz.android',
  temu: 'com.einnovation.temu',
  aliexpress: 'com.alibaba.aliexpresshd',
  ebay: 'com.ebay.mobile',
  
  // Finance/Banking (Bangladesh)
  bkash: 'com.bKash.customerapp',
  nagad: 'com.nagad.app',
  rocket: 'com.dbbl.mbs.rcbl',
  upay: 'com.upay.service',
  sslcommerz: 'com.sslcommerz.secureintent',
  
  // Finance/General
  paypal: 'com.paypal.android.p2pmobile',
  venmo: 'com.venmo',
  cashapp: 'com.squareup.cash',
  googlepay: 'com.google.android.apps.nbu.paisa.user',
  samsungpay: 'com.samsung.android.spay',
  
  // Transport
  uber: 'com.ubercab',
  lyft: 'com.medallia.yx01',
  pathao: 'com.pathao.user',
  sslmerchants: 'com.sslwireless.sslmerchant',
  
  // Video Editing
  capcut: 'com.lemon.lvoverseas',
  inshot: 'com.camerasideas.instashot',
  kinemaster: 'com.nexstreaming.app.kinemasterfree',
  vn: 'com.videovolution.app',
  
  // Productivity
  canva: 'com.canva.editor',
  notion: 'notion.id',
  trello: 'com.trello',
  asana: 'com.asana.app',
  slack: 'com.Slack',
  zoom: 'us.zoom.videomeetings',
  meet: 'com.google.android.apps.meetings',
  teams: 'com.microsoft.teams',
  outlook: 'com.microsoft.office.outlook',
  
  // AI
  chatgpt: 'com.openai.chatgpt',
  copilot: 'com.microsoft.copilot',
  claude: 'com.anthropic.claude',
  gemini: 'com.google.android.apps.gemini',
  
  // News
  bbc: 'org.bbc.iplayer',
  cnn: 'com.cnn.mobile.android.phone',
  aljazeera: 'com.aljazeera.mobile',
  
  // Browser
  firefox: 'org.mozilla.firefox',
  opera: 'com.opera.browser',
  edge: 'com.microsoft.emmx',
  samsungbrowser: 'com.sec.android.app.sbrowser',
  
  // File Manager
  files: 'com.android.documentsui',
  solid: 'com.estrongs.android.pop',
  
  // Utilities
  settings: 'com.android.settings',
  calculator: 'com.google.android.calculator',
  flashlight: 'com.sec.android.app.light',
  
  // Misc
  zoom: 'us.zoom.videomeetings',
  dropbox: 'com.dropbox.android',
  onedrive: 'com.microsoft.skydrive',
  googlephotos: 'com.google.android.apps.photos',
  wps: 'cn.wps.moffice_eng',
  gbwhatsapp: 'com.gbwhatsapp',
}
