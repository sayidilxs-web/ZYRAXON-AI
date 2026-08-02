import { Database } from 'bun:sqlite'

export interface ToolRecord {
  toolName: string
  args: string
  result: string
  success: boolean
  latency: number
  timestamp: number
  sessionId: string
}

export interface SemanticNode {
  id: string
  concept: string
  frequency: number
  successRate: number
  avgLatency: number
  relatedConcepts: string[]
}

export class MemoryGraphEngine {
  private db: Database
  private pruningInterval: Timer | null = null

  async init() {
    this.db = new Database(':memory:')
    this.db.run(`CREATE TABLE IF NOT EXISTS tool_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tool_name TEXT,
      args_hash TEXT,
      result_summary TEXT,
      success INTEGER,
      latency REAL,
      timestamp INTEGER,
      session_id TEXT
    )`)
    this.db.run(`CREATE TABLE IF NOT EXISTS semantic_graph (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      concept TEXT UNIQUE,
      frequency INTEGER DEFAULT 1,
      success_rate REAL DEFAULT 1.0,
      avg_latency REAL DEFAULT 0,
      related_concepts TEXT DEFAULT '[]'
    )`)
    this.startPruningLoop()
  }

  async record(toolName: string, result: any, success: boolean) {
    const latency = performance.now()
    this.db.run(
      `INSERT INTO tool_history (tool_name, args_hash, result_summary, success, latency, timestamp, session_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [toolName, '', JSON.stringify(result).slice(0, 200), success ? 1 : 0, latency, Date.now(), '']
    )
    this.updateSemanticGraph(toolName, latency, success)
  }

  private updateSemanticGraph(concept: string, latency: number, success: boolean) {
    const existing = this.db.query(`SELECT * FROM semantic_graph WHERE concept = ?`).get(concept) as any
    if (existing) {
      const newFreq = existing.frequency + 1
      const newRate = ((existing.success_rate * existing.frequency) + (success ? 1 : 0)) / newFreq
      const newLat = ((existing.avg_latency * existing.frequency) + latency) / newFreq
      this.db.run(
        `UPDATE semantic_graph SET frequency = ?, success_rate = ?, avg_latency = ? WHERE concept = ?`,
        [newFreq, newRate, newLat, concept]
      )
    } else {
      this.db.run(
        `INSERT INTO semantic_graph (concept, frequency, success_rate, avg_latency) VALUES (?, ?, ?, ?)`,
        [concept, 1, success ? 1 : 0, latency]
      )
    }
  }

  getHighSuccessPatterns(threshold: number = 0.95): SemanticNode[] {
    return this.db.query(
      `SELECT * FROM semantic_graph WHERE success_rate >= ? AND frequency >= 3 ORDER BY success_rate DESC, frequency DESC`
    ).all(threshold) as SemanticNode[]
  }

  private startPruningLoop() {
    this.pruningInterval = setInterval(() => {
      this.pruneOldEntries()
    }, 3600000)
  }

  private pruneOldEntries() {
    const weekAgo = Date.now() - 604800000
    this.db.run(`DELETE FROM tool_history WHERE timestamp < ?`, [weekAgo])
    this.db.run(`DELETE FROM semantic_graph WHERE frequency < 2 AND success_rate < 0.5`)
  }

  async shutdown() {
    if (this.pruningInterval) clearInterval(this.pruningInterval)
    this.db.close()
  }
}
