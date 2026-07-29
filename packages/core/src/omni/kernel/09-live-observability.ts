import { execSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'

export interface CrashReport {
  timestamp: number
  error: string
  stackTrace: string
  appState: string
  suggestedFix?: string
}

export class LiveObservability {
  private reports: CrashReport[] = []

  async captureError(error: Error, context?: string): Promise<CrashReport> {
    const report: CrashReport = {
      timestamp: Date.now(),
      error: error.message,
      stackTrace: error.stack || '',
      appState: context || this.getCurrentAppState(),
    }
    this.reports.push(report)
    report.suggestedFix = await this.analyzeAndSuggest(report)
    return report
  }

  private getCurrentAppState(): string {
    try {
      const log = execSync('tail -50 packages/core/logs/error.log 2>/dev/null || echo ""', { encoding: 'utf-8', timeout: 3000 })
      return log.slice(0, 500)
    } catch {
      return 'unknown'
    }
  }

  private async analyzeAndSuggest(report: CrashReport): Promise<string> {
    if (report.error.includes('undefined') || report.error.includes('null')) {
      return 'Add null check before accessing the property'
    }
    if (report.error.includes('not a function')) {
      return 'Check if the import/exports are correct for the module'
    }
    if (report.error.includes('ENOENT')) {
      return 'File not found - check the path or create the directory'
    }
    return 'Analyze the stack trace manually'
  }

  getRecentReports(n: number = 5): CrashReport[] {
    return this.reports.slice(-n)
  }
}
