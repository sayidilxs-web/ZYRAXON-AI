import { spawn } from 'node:child_process'

export interface AutoTestResult {
  command: string
  success: boolean
  output: string
  errors: string[]
}

export class TerminalAutonomy {
  private history: AutoTestResult[] = []

  async autoTest(command: string, cwd?: string): Promise<AutoTestResult> {
    return new Promise((resolve) => {
      const proc = spawn(command, [], {
        shell: true,
        cwd: cwd || process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 30000,
      })

      let stdout = ''
      let stderr = ''

      proc.stdout.on('data', (d) => { stdout += d.toString() })
      proc.stderr.on('data', (d) => { stderr += d.toString() })

      proc.on('close', (code) => {
        const result: AutoTestResult = {
          command,
          success: code === 0,
          output: stdout.slice(0, 1000),
          errors: stderr ? [stderr.slice(0, 500)] : [],
        }
        this.history.push(result)
        resolve(result)
      })

      proc.on('error', (err) => {
        const result: AutoTestResult = { command, success: false, output: '', errors: [err.message] }
        this.history.push(result)
        resolve(result)
      })
    })
  }

  async autoFix(command: string, error: string): Promise<string | null> {
    if (error.includes('not found') || error.includes('No such file')) {
      const fix = `npm install ${command.split(' ')[0]}`
      return fix
    }
    if (error.includes('SyntaxError') || error.includes('TypeError')) {
      return null
    }
    return null
  }

  getHistory(): AutoTestResult[] {
    return this.history
  }
}
