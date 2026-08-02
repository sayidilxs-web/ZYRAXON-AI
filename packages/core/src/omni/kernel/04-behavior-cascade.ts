export interface FlowState {
  typingSpeed: number
  scrollDepth: number
  activeFile: string
  lastActions: string[]
  currentMode: 'exploring' | 'editing' | 'debugging' | 'idle'
}

export class BehaviorCascade {
  private currentState: FlowState = {
    typingSpeed: 0,
    scrollDepth: 0,
    activeFile: '',
    lastActions: [],
    currentMode: 'idle',
  }

  private modePatterns: Record<string, RegExp[]> = {
    exploring: [/ls/, /cd /, /find/, /grep/, /cat /, /head /, /tail /, /readfile/i],
    editing: [/edit/, /write/, /sed/, /vim/, /nano/, /code/, /replace/i],
    debugging: [/error/, /fail/, /crash/, /debug/, /test /, /npm test/, /bun test/],
  }

  analyzeAction(action: string) {
    this.currentState.lastActions.push(action)
    if (this.currentState.lastActions.length > 10) this.currentState.lastActions.shift()

    for (const [mode, patterns] of Object.entries(this.modePatterns)) {
      if (patterns.some((p) => p.test(action))) {
        this.currentState.currentMode = mode as FlowState['currentMode']
        break
      }
    }
  }

  predictNextAction(): string | null {
    const mode = this.currentState.currentMode
    if (mode === 'exploring') return 'suggesting file to edit'
    if (mode === 'editing') return 'preparing auto-save and compile'
    if (mode === 'debugging') return 'preparing fix based on error pattern'
    return null
  }

  getState(): FlowState {
    return { ...this.currentState }
  }
}
