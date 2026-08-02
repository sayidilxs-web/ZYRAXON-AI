import { execSync } from 'node:child_process'

export interface GitCommit {
  message: string
  hash: string
  timestamp: number
}

export class GitPairProgramming {
  private lastCommitHash: string = ''

  async autoCommit(message: string, files?: string[]) {
    try {
      if (files && files.length > 0) {
        execSync(`git add ${files.join(' ')}`, { stdio: 'pipe' })
      } else {
        execSync('git add -A', { stdio: 'pipe' })
      }
      execSync(`git commit -m "${this.sanitizeMessage(message)}"`, { stdio: 'pipe' })
      const hash = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim()
      this.lastCommitHash = hash
      return { success: true, hash }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  async autoRollback(): Promise<boolean> {
    if (!this.lastCommitHash) return false
    try {
      execSync(`git revert --no-edit ${this.lastCommitHash}`, { stdio: 'pipe' })
      return true
    } catch {
      try {
        execSync(`git reset --hard HEAD~1`, { stdio: 'pipe' })
        return true
      } catch {
        return false
      }
    }
  }

  private sanitizeMessage(msg: string): string {
    return msg.replace(/"/g, "'").slice(0, 100)
  }
}
