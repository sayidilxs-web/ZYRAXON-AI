import { Database } from 'bun:sqlite'

export interface KnowledgeEntry {
  id: number
  pattern: string
  category: string
  solution: string
  frequency: number
  confidence: number
}

export class KnowledgeGraph {
  private db: Database

  async init() {
    this.db = new Database(':memory:')
    this.db.run(`CREATE TABLE IF NOT EXISTS knowledge_graph (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pattern TEXT UNIQUE,
      category TEXT,
      solution TEXT,
      frequency INTEGER DEFAULT 1,
      confidence REAL DEFAULT 0.5,
      created_at INTEGER,
      last_accessed INTEGER
    )`)
  }

  async learn(pattern: string, category: string, solution: string) {
    const existing = this.db.query(`SELECT * FROM knowledge_graph WHERE pattern = ?`).get(pattern) as any
    if (existing) {
      this.db.run(
        `UPDATE knowledge_graph SET frequency = frequency + 1, confidence = MIN(1.0, confidence + 0.1), last_accessed = ? WHERE pattern = ?`,
        [Date.now(), pattern]
      )
    } else {
      this.db.run(
        `INSERT INTO knowledge_graph (pattern, category, solution, created_at, last_accessed) VALUES (?, ?, ?, ?, ?)`,
        [pattern, category, solution, Date.now(), Date.now()]
      )
    }
  }

  async recall(context: string): Promise<KnowledgeEntry[]> {
    const words = context.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
    if (words.length === 0) return []

    const conditions = words.map(() => 'pattern LIKE ?').join(' OR ')
    const params = words.map((w) => `%${w}%`)
    const results = this.db.query(
      `SELECT * FROM knowledge_graph WHERE ${conditions} ORDER BY confidence DESC, frequency DESC LIMIT 5`
    ).all(...params) as KnowledgeEntry[]

    return results
  }

  async getHighConfidence(threshold: number = 0.8): Promise<KnowledgeEntry[]> {
    return this.db.query(
      `SELECT * FROM knowledge_graph WHERE confidence >= ? ORDER BY frequency DESC`
    ).all(threshold) as KnowledgeEntry[]
  }
}
