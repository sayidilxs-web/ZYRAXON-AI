import { Database } from 'bun:sqlite'
import { MultiFileComposer } from './01-multi-file-composer'
import { TerminalAutonomy } from './02-terminal-autonomy'
import { BackgroundLoop } from './03-background-loop'
import { BehaviorCascade } from './04-behavior-cascade'
import { GitPairProgramming } from './05-git-pair'
import { SandboxRuntime } from './06-sandbox-runtime'
import { IdeaToDeploy } from './07-idea-to-deploy'
import { CostRouter } from './08-cost-router'
import { LiveObservability } from './09-live-observability'
import { KnowledgeGraph } from './10-knowledge-graph'
import { SecurityScanner } from './11-security-scanner'
import { SilentPrecompile } from './12-silent-precompile'
import { VisualContextSync } from './13-visual-context-sync'
import { SelfEvolvingPrompt } from './14-self-evolving-prompt'
import { ZeroTrustToken } from './15-zero-trust-token'

export class KernelEngine {
  mechanisms: Record<string, any> = {}
  private db: Database
  private learningDb: Database

  async init() {
    this.db = new Database(':memory:')
    this.learningDb = new Database(':memory:')
    this.db.run(`CREATE TABLE IF NOT EXISTS mechanism_registry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      active INTEGER DEFAULT 1,
      success_count INTEGER DEFAULT 0,
      fail_count INTEGER DEFAULT 0,
      last_used INTEGER
    )`)

    this.mechanisms = {
      'multi-file-composer': new MultiFileComposer(),
      'terminal-autonomy': new TerminalAutonomy(),
      'background-loop': new BackgroundLoop(),
      'behavior-cascade': new BehaviorCascade(),
      'git-pair': new GitPairProgramming(),
      'sandbox-runtime': new SandboxRuntime(),
      'idea-to-deploy': new IdeaToDeploy(),
      'cost-router': new CostRouter(),
      'live-observability': new LiveObservability(),
      'knowledge-graph': new KnowledgeGraph(),
      'security-scanner': new SecurityScanner(),
      'silent-precompile': new SilentPrecompile(),
      'visual-context-sync': new VisualContextSync(),
      'self-evolving-prompt': new SelfEvolvingPrompt(),
      'zero-trust-token': new ZeroTrustToken(),
    }

    for (const [name, mechanism] of Object.entries(this.mechanisms)) {
      if (mechanism.init) await mechanism.init()
      this.db.run(`INSERT OR IGNORE INTO mechanism_registry (name) VALUES (?)`, [name])
    }
  }

  async learn(toolName: string, result: any) {
    const mech = this.findRelevantMechanism(toolName)
    if (mech && this.mechanisms[mech]) {
      await this.mechanisms[mech].learn?.(toolName, result)
      this.db.run(`UPDATE mechanism_registry SET success_count = success_count + 1, last_used = ? WHERE name = ?`, [Date.now(), mech])
    }
  }

  private findRelevantMechanism(toolName: string): string | null {
    const mapping: Record<string, string> = {
      'edit': 'multi-file-composer',
      'write': 'multi-file-composer',
      'bash': 'terminal-autonomy',
      'task': 'background-loop',
      'browser': 'visual-context-sync',
      'memory': 'knowledge-graph',
      'strike': 'security-scanner',
    }
    return mapping[toolName] ?? null
  }

  async getActiveMechanisms(): Promise<string[]> {
    const rows = this.db.query(`SELECT name FROM mechanism_registry WHERE active = 1`).all() as any[]
    return rows.map((r) => r.name)
  }
}
