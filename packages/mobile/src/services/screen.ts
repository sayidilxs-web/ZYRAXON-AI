import * as ScreenCapture from 'expo-screen-capture'
import * as MediaLibrary from 'expo-media-library'
import * as FileSystem from 'expo-file-system'

let isRecording = false

export async function captureScreenshot(): Promise<string | null> {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync()
    if (status !== 'granted') {
      throw new Error('Media library permission not granted')
    }
    const uri = await ScreenCapture.captureScreenAsync()
    const dest = `${FileSystem.cacheDirectory}screenshots/screen_${Date.now()}.png`
    await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory! + 'screenshots/', {
      intermediates: true,
    })
    await FileSystem.moveAsync({ from: uri, to: dest })
    return dest
  } catch (err) {
    console.warn('Screenshot failed:', err)
    return null
  }
}

export function startScreenRecording(): boolean {
  try {
    ScreenCapture.preventScreenCapture()
    isRecording = true
    return true
  } catch {
    return false
  }
}

export function stopScreenRecording(): boolean {
  try {
    ScreenCapture.allowScreenCapture()
    isRecording = false
    return true
  } catch {
    return false
  }
}

export function isRecordingScreen(): boolean {
  return isRecording
}
