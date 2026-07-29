import { mkdir, cp, rm, readdir, writeFile, exists } from 'node:fs/promises'
import { join, resolve } from 'node:path'

export class ShadowCloneEngine {
  private shadowRoot: string = ''
  private active: boolean = false

  async init() {
    this.shadowRoot = join(process.cwd(), '.zyraxon-shadow')
    await mkdir(this.shadowRoot, { recursive: true })
    this.active = true
  }

  async cloneWorkspace(workspacePath: string): Promise<string> {
    const shadowPath = join(this.shadowRoot, `shadow-${Date.now()}`)
    await mkdir(shadowPath, { recursive: true })
    await cp(workspacePath, shadowPath, { recursive: true, force: true })
    return shadowPath
  }

  async dryRun(filePath: string, newContent: string): Promise<{ valid: boolean; errors: string[] }> {
    if (!this.active) return { valid: true, errors: [] }
    try {
      const ext = filePath.split('.').pop()
      const tempPath = join(this.shadowRoot, `dry-${Date.now()}.${ext}`)
      await writeFile(tempPath, newContent)

      const errors: string[] = []

      if (ext === 'ts' || ext === 'tsx') {
        try {
          const proc = Bun.spawnSync(['bun', 'build', '--no-bundle', tempPath], {
            cwd: this.shadowRoot,
            stdio: ['ignore', 'pipe', 'pipe'],
          })
          if (!proc.success) errors.push(proc.stderr.toString().slice(0, 500))
        } catch (e: any) {
          errors.push(e.message)
        }
      }

      await rm(tempPath).catch(() => {})
      return { valid: errors.length === 0, errors }
    } catch (e: any) {
      return { valid: false, errors: [e.message] }
    }
  }

  async repair(filePath: string, error: any): Promise<string | null> {
    const errStr = typeof error === 'string' ? error : JSON.stringify(error)
    return errStr
  }

  async shutdown() {
    await rm(this.shadowRoot, { recursive: true, force: true }).catch(() => {})
    this.active = false
  }
}
