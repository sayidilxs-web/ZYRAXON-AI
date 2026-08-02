interface VoiceCallbacks {
  onTranscript: (text: string) => void
  onError?: (error: Error) => void
}

class VoiceService {
  private callbacks: VoiceCallbacks | null = null

  setCallbacks(callbacks: VoiceCallbacks): void {
    this.callbacks = callbacks
  }

  async startListening(): Promise<void> {
    console.log('Voice service: start listening')
  }

  async stopListening(): Promise<void> {
    console.log('Voice service: stop listening')
  }

  isListening(): boolean {
    return false
  }
}

export const voiceService = new VoiceService()
