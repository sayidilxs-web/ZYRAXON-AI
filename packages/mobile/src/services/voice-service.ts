import * as Speech from 'expo-speech'

type VoiceCallback = {
  onTranscript?: (text: string) => void
  onSpeakingState?: (speaking: boolean) => void
  onError?: (error: string) => void
}

class VoiceService {
  private isSpeaking = false
  private isListening = false
  private callbacks: VoiceCallback = {}
  private recognition: any = null

  setCallbacks(cb: VoiceCallback) {
    this.callbacks = cb
  }

  async speak(text: string): Promise<void> {
    if (this.isSpeaking) {
      await Speech.stop()
    }
    this.isSpeaking = true
    this.callbacks.onSpeakingState?.(true)
    return new Promise((resolve) => {
      Speech.speak(text, {
        language: 'bn',
        rate: 0.85,
        onDone: () => {
          this.isSpeaking = false
          this.callbacks.onSpeakingState?.(false)
          resolve()
        },
        onError: () => {
          this.isSpeaking = false
          this.callbacks.onSpeakingState?.(false)
          resolve()
        },
      })
    })
  }

  async stopSpeaking(): Promise<void> {
    await Speech.stop()
    this.isSpeaking = false
    this.callbacks.onSpeakingState?.(false)
  }

  async startListening(): Promise<void> {
    if (this.isListening) return
    this.isListening = true
    this.callbacks.onTranscript?.('Listening...')

    try {
      const SpeechRecognition = (await import('expo-speech-recognition')).default
      const result = await SpeechRecognition.requestPermissionsAsync()
      if (!result.granted) {
        throw new Error('Speech permission denied')
      }
      this.recognition = SpeechRecognition
      SpeechRecognition.addEventListener('result', (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript
        if (transcript) {
          this.callbacks.onTranscript?.(transcript)
        }
      })
      SpeechRecognition.startListeningAsync({ lang: 'bn-BD', interimResults: true })
    } catch (err: any) {
      console.warn('Speech recognition fallback:', err.message)
      this.callbacks.onError?.(err.message)
      this.isListening = false
    }
  }

  async stopListening(): Promise<void> {
    this.isListening = false
    try {
      const SpeechRecognition = (await import('expo-speech-recognition')).default
      await SpeechRecognition.stopListeningAsync()
    } catch {}
  }

  getSpeakingState(): boolean {
    return this.isSpeaking
  }

  getListeningState(): boolean {
    return this.isListening
  }
}

export const voiceService = new VoiceService()
