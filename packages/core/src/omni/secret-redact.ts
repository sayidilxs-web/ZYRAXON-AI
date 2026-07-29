import { readFile } from 'node:fs/promises'

const SECRET_PATTERNS = [
  /(?:api[_-]?key|apikey|secret|token|password|passwd|credential|auth)\s*[:=]\s*['"]?[A-Za-z0-9_\-\.]{16,}['"]?/gi,
  /sk-[A-Za-z0-9]{32,}/g,
  /ghp_[A-Za-z0-9]{36,}/g,
  /gho_[A-Za-z0-9]{36,}/g,
  /xox[bpsar]-[A-Za-z0-9]{10,}/g,
  /AKIA[0-9A-Z]{16}/g,
  /-----BEGIN (RSA |EC )?PRIVATE KEY-----/g,
  /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
]

const CONTEXTUAL_PATTERNS = [
  /\b(?:password|secret|key|token)\s*[:=]\s*'[^']+'/gi,
  /\b(?:password|secret|key|token)\s*[:=]\s*"[^"]+"/gi,
  /process\.env\.\w+/g,
]

export class SecretRedactEngine {
  private active: boolean = false
  private envVars: Map<string, string> = new Map()

  async init() {
    this.active = true
    await this.loadEnvVars()
  }

  private async loadEnvVars() {
    try {
      const envContent = await readFile('.env', 'utf-8').catch(() => '')
      for (const line of envContent.split('\n')) {
        const match = line.match(/^(\w+)=["']?(.+)["']?$/)
        if (match) this.envVars.set(match[1].toLowerCase(), match[2].trim())
      }
    } catch {}
  }

  sanitizeContext(context: any): any {
    if (!this.active) return context
    const str = JSON.stringify(context)
    const sanitized = this.applyPatterns(str)
    try {
      return JSON.parse(sanitized)
    } catch {
      return sanitized
    }
  }

  sanitizeString(input: string): string {
    if (!this.active) return input
    return this.applyPatterns(input)
  }

  private applyPatterns(input: string): string {
    let result = input

    for (const pattern of SECRET_PATTERNS) {
      result = result.replace(pattern, '[REDACTED]')
    }
    for (const pattern of CONTEXTUAL_PATTERNS) {
      result = result.replace(pattern, '[REDACTED]')
    }
    for (const [key, value] of this.envVars) {
      if (value.length > 8) {
        const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        result = result.replace(new RegExp(escaped, 'g'), '[ENV_REDACTED]')
      }
    }
    if (this.containsApiKey(result)) {
      result = this.aggressiveRedact(result)
    }
    return result
  }

  private containsApiKey(input: string): boolean {
    return SECRET_PATTERNS.some((p) => p.test(input))
  }

  private aggressiveRedact(input: string): string {
    return input.replace(/[A-Za-z0-9_-]{20,}/g, '[KEY_REDACTED]')
  }

  async shutdown() {
    this.active = false
  }
}
