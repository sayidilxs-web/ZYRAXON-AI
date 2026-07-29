import * as Speech from 'expo-speech'

let isSpeaking = false

export function speak(text: string, onDone?: () => void) {
  if (isSpeaking) {
    Speech.stop()
    isSpeaking = false
  }
  isSpeaking = true
  Speech.speak(text, {
    language: 'en',
    rate: 0.9,
    onDone: () => {
      isSpeaking = false
      onDone?.()
    },
    onError: () => {
      isSpeaking = false
    },
  })
}

export function stopSpeaking() {
  Speech.stop()
  isSpeaking = false
}

export function isSpeakingNow(): boolean {
  return isSpeaking
}

export function getAvailableVoices(): Promise<string[]> {
  return Speech.getAvailableVoicesAsync().then((voices) =>
    voices.map((v) => v.identifier),
  )
}
