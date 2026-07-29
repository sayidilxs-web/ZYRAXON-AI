import * as ScreenCapture from 'expo-screen-capture'
import * as FileSystem from 'expo-file-system'
import { Platform, Dimensions } from 'react-native'
import type { VisionFrame } from './protocol'

const SCREENSHOT_DIR = `${FileSystem.cacheDirectory}screenshots/`

export async function ensureDirectories(): Promise<void> {
  await FileSystem.makeDirectoryAsync(SCREENSHOT_DIR, { intermediates: true })
}

export async function takeScreenshot(): Promise<VisionFrame | null> {
  try {
    await ensureDirectories()
    const uri = await ScreenCapture.captureScreenAsync()
    const dest = `${SCREENSHOT_DIR}screen_${Date.now()}.png`
    await FileSystem.moveAsync({ from: uri, to: dest })
    const base64 = await FileSystem.readAsStringAsync(dest, {
      encoding: FileSystem.EncodingType.Base64,
    })
    return {
      base64,
      timestamp: Date.now(),
      type: 'screenshot',
    }
  } catch (err) {
    console.warn('Screenshot failed:', err)
    return null
  }
}

export async function takeScreenshotBase64(): Promise<string | null> {
  const frame = await takeScreenshot()
  return frame?.base64 ?? null
}

export function getScreenDimensions(): { width: number; height: number } {
  const { width, height } = Dimensions.get('window')
  return { width, height }
}

export function getPlatformInfo() {
  return {
    platform: Platform.OS,
    screen_width: Dimensions.get('window').width,
    screen_height: Dimensions.get('window').height,
  }
}
