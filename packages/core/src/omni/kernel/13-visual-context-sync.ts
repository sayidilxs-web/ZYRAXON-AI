export interface VisualContext {
  screenContent: string
  detectedErrors: string[]
  uiElements: string[]
  browserUrl?: string
  timestamp: number
}

export class VisualContextSync {
  private lastContext: VisualContext | null = null
  private errorBuffer: string[] = []

  async syncFromScreen(screenText: string): Promise<VisualContext> {
    const context: VisualContext = {
      screenContent: screenText,
      detectedErrors: this.detectErrors(screenText),
      uiElements: this.extractUIElements(screenText),
      timestamp: Date.now(),
    }
    this.lastContext = context

    if (context.detectedErrors.length > 0) {
      this.errorBuffer.push(...context.detectedErrors)
      if (this.errorBuffer.length > 20) this.errorBuffer.splice(0, this.errorBuffer.length - 20)
    }

    return context
  }

  private detectErrors(text: string): string[] {
    const errors: string[] = []
    const patterns = [
      /(?:Error|Exception|Fatal|Failed|Crash):\s*[^\n]+/gi,
      /(?:Uncaught|Unhandled|Rejected|Rejection)[^\n]+/gi,
      /(?:SyntaxError|TypeError|ReferenceError|RangeError):[^\n]+/gi,
      /\b(?:404|500|403|401|502|503)\s+(?:Error|Not Found|Forbidden|Unauthorized)/gi,
    ]
    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(text)) !== null) {
        errors.push(match[0].trim())
      }
    }
    return [...new Set(errors)].slice(0, 5)
  }

  private extractUIElements(text: string): string[] {
    const elements: string[] = []
    const patterns = [
      /<button[^>]*>([^<]+)<\/button>/gi,
      /<a[^>]*>([^<]+)<\/a>/gi,
      /aria-label="([^"]+)"/gi,
      /placeholder="([^"]+)"/gi,
      /class="([^"]*)btn[^"]*"/gi,
    ]
    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(text)) !== null) {
        elements.push(match[1] || match[0])
      }
    }
    return [...new Set(elements)]
  }

  getLastContext(): VisualContext | null {
    return this.lastContext
  }

  getRecentErrors(): string[] {
    return [...this.errorBuffer]
  }
}
