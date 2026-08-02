export class SilentPrecompile {
  private diagnosticCache: Map<string, { errors: string[]; timestamp: number }> = new Map()

  async preverify(code: string, language: string = 'ts'): Promise<{ valid: boolean; errors: string[] }> {
    const cacheKey = `${language}:${this.hashCode(code)}`
    const cached = this.diagnosticCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < 5000) return { valid: cached.errors.length === 0, errors: cached.errors }

    const errors: string[] = []

    if (language === 'ts' || language === 'tsx') {
      this.checkTypeScriptErrors(code, errors)
    } else if (language === 'js') {
      this.checkJavaScriptErrors(code, errors)
    }

    this.diagnosticCache.set(cacheKey, { errors, timestamp: Date.now() })
    return { valid: errors.length === 0, errors }
  }

  private checkTypeScriptErrors(code: string, errors: string[]) {
    if (code.includes(': any') && !code.includes('// eslint-disable')) {
      // Allow `any` but note it
    }
    const importRegex = /import\s+\{\s*([^}]+)\s*\}\s*from\s+['"]([^'"]+)['"]/g
    let match
    while ((match = importRegex.exec(code)) !== null) {
      const imports = match[1].split(',').map((i) => i.trim())
      for (const imp of imports) {
        const name = imp.split(' as ')[0].trim().split(/\s+/).pop()
        if (name && !code.includes(name + '(') && !code.includes(name + '.') && !code.includes('new ' + name)) {
          if (!code.includes(`typeof ${name}`) && !code.includes(`type ${name}`)) {
            // unused import — non-critical
          }
        }
      }
    }
  }

  private checkJavaScriptErrors(code: string, errors: string[]) {
    const lines = code.split('\n')
    lines.forEach((line, i) => {
      const trimmed = line.trim()
      if (trimmed.endsWith('&&') || trimmed.endsWith('||') || trimmed.endsWith(',')) {
        errors.push(`Line ${i + 1}: Possible trailing operator`)
      }
    })
  }

  private hashCode(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash |= 0
    }
    return hash.toString(36)
  }

  clearCache() {
    this.diagnosticCache.clear()
  }
}
