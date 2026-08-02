import { Database } from 'bun:sqlite'
import { readFile, writeFile } from 'node:fs/promises'

export interface PromptRule {
  id: number
  trigger: string
  action: string
  successCount: number
  effectiveness: number
}

export class SelfEvolvingPrompt {
  private db: Database
  private promptPath: string = ''

  async init() {
    this.db = new Database(':memory:')
    this.db.run(`CREATE TABLE IF NOT EXISTS prompt_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trigger TEXT,
      action TEXT,
      success_count INTEGER DEFAULT 1,
      effectiveness REAL DEFAULT 0.5,
      created_at INTEGER
    )`)
    this.promptPath = process.cwd() + '/packages/core/src/omni/kernel/prompt-rules.json'
  }

  async learn(trigger: string, action: string, success: boolean) {
    const existing = this.db.query(`SELECT * FROM prompt_rules WHERE trigger = ? AND action = ?`).get(trigger, action) as any
    if (existing) {
      const newCount = existing.success_count + (success ? 1 : 0)
      const newEff = Math.min(1.0, (existing.effectiveness * existing.success_count + (success ? 1 : 0)) / newCount)
      this.db.run(
        `UPDATE prompt_rules SET success_count = ?, effectiveness = ? WHERE id = ?`,
        [newCount, newEff, existing.id]
      )
    } else {
      this.db.run(
        `INSERT INTO prompt_rules (trigger, action, success_count, effectiveness, created_at) VALUES (?, ?, 1, ?, ?)`,
        [trigger, action, success ? 0.8 : 0.2, Date.now()]
      )
    }
  }

  async suggest(problem: string): Promise<string | null> {
    const words = problem.toLowerCase().split(/\s+/)
    const conditions = words.map(() => 'trigger LIKE ?').join(' OR ')
    const params = words.map((w) => `%${w}%`)
    const results = this.db.query(
      `SELECT * FROM prompt_rules WHERE ${conditions} ORDER BY effectiveness DESC, success_count DESC LIMIT 1`
    ).all(...params) as PromptRule[]

    return results.length > 0 ? results[0].action : null
  }

  async exportRules(): Promise<string> {
    const rules = this.db.query(`SELECT * FROM prompt_rules ORDER BY effectiveness DESC`).all() as PromptRule[]
    return JSON.stringify(rules, null, 2)
  }

  async saveToFile() {
    const rules = await this.exportRules()
    await writeFile(this.promptPath, rules, 'utf-8')
  }
}
