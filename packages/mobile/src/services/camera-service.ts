import { Camera, CameraType } from 'expo-camera'
import * as FileSystem from 'expo-file-system'
import type { VisionFrame } from '../mobile-agent/protocol'

const FRAME_DIR = `${FileSystem.cacheDirectory}camera_frames/`

export async function ensureFrameDir(): Promise<void> {
  await FileSystem.makeDirectoryAsync(FRAME_DIR, { intermediates: true })
}

export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await Camera.requestCameraPermissionsAsync()
  return status === 'granted'
}

export async function captureFrame(cameraRef: Camera | null): Promise<VisionFrame | null> {
  if (!cameraRef) return null
  try {
    await ensureFrameDir()
    const photo = await cameraRef.takePictureAsync({ base64: true, quality: 0.5 })
    if (!photo?.base64) return null
    const dest = `${FRAME_DIR}frame_${Date.now()}.jpg`
    await FileSystem.moveAsync({ from: photo.uri, to: dest })
    return {
      base64: photo.base64,
      timestamp: Date.now(),
      type: 'camera',
    }
  } catch (err) {
    console.warn('Camera capture failed:', err)
    return null
  }
}

export { Camera, CameraType }
