const TOKEN_PATTERNS = [
  /ghp_[A-Za-z0-9]{36,}/g,
  /gho_[A-Za-z0-9]{36,}/g,
  /ghu_[A-Za-z0-9]{36,}/g,
  /ghs_[A-Za-z0-9]{36,}/g,
  /ghr_[A-Za-z0-9]{36,}/g,
  /sk-[A-Za-z0-9]{32,}/g,
  /pk-[A-Za-z0-9]{32,}/g,
  /xox[bpsar]-[A-Za-z0-9]{10,}/g,
  /AKIA[0-9A-Z]{16}/g,
  /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
  /(?:api[_-]?key|apikey|secret|token|password)\s*[:=]\s*['"]?[A-Za-z0-9_\-\.]{16,}['"]?/gi,
  /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
  /(?:gh|gl|gb)_[A-Za-z0-9]{20,}/g,
  /AIza[0-9A-Za-z_-]{35}/g,
  /SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}/g,
  /(?:facebook|fb|twitter|instagram|github)_?token['"]?\s*[:=]\s*['"][A-Za-z0-9_\-\.]{10,}['"]?/gi,
]

const SENSITIVE_FILES = [
  '.env', '.env.local', '.env.production', '.env.development',
  'credentials.json', 'service-account.json', 'config.yml',
  'id_rsa', 'id_ed25519', 'deploy-key',
  'tokens.txt', 'secrets.json', 'passwords.txt',
]

export class ZeroTrustToken {
  private active: boolean = false

  async init() {
    this.active = true
  }

  stripTokens(data: string): string {
    if (!this.active) return data
    let result = data
    for (const pattern of TOKEN_PATTERNS) {
      result = result.replace(pattern, (match) => {
        if (match.length > 15) return match.slice(0, 4) + '...' + match.slice(-4)
        return match
      })
    }
    return result
  }

  stripFromObject(obj: any): any {
    if (!this.active) return obj
    const str = JSON.stringify(obj)
    const cleaned = this.stripTokens(str)
    try {
      return JSON.parse(cleaned)
    } catch {
      return cleaned
    }
  }

  detectSensitiveFile(filename: string): boolean {
    return SENSITIVE_FILES.some((f) => filename.endsWith(f) || filename.includes(f))
  }

  async scanFile(content: string, filename: string): Promise<Array<{ finding: string; severity: 'low' | 'high' | 'critical' }>> {
    const findings: Array<{ finding: string; severity: 'low' | 'high' | 'critical' }> = []

    if (this.detectSensitiveFile(filename)) {
      findings.push({ finding: `Sensitive file detected: ${filename}`, severity: 'critical' })
    }

    for (const pattern of TOKEN_PATTERNS) {
      const matches = content.match(pattern)
      if (matches) {
        findings.push({
          finding: `Potential token/secret found in ${filename}: ${matches[0].slice(0, 10)}...`,
          severity: 'critical',
        })
      }
    }

    return findings
  }

  async shutdown() {
    this.active = false
  }
}
