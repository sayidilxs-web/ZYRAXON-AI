import { execSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

export class SandboxRuntime {
  private sandboxDir: string = ''

  constructor() {
    this.sandboxDir = mkdtempSync(join(tmpdir(), 'zyraxon-sandbox-'))
  }

  async runInSandbox(code: string, language: string = 'ts'): Promise<{ success: boolean; output: string; error?: string }> {
    try {
      const ext = language === 'ts' ? '.ts' : language === 'js' ? '.js' : '.sh'
      const filePath = join(this.sandboxDir, `sandbox-${Date.now()}${ext}`)
      writeFileSync(filePath, code)

      let command: string
      if (language === 'ts') command = `bun run ${filePath}`
      else if (language === 'js') command = `node ${filePath}`
      else command = `bash ${filePath}`

      const output = execSync(command, { timeout: 10000, encoding: 'utf-8', cwd: this.sandboxDir })
      rmSync(filePath, { force: true })
      return { success: true, output: output.slice(0, 2000) }
    } catch (err: any) {
      return { success: false, output: '', error: err.stderr || err.message }
    }
  }

  cleanup() {
    rmSync(this.sandboxDir, { recursive: true, force: true })
  }
}
