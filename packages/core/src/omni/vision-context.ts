import { Database } from 'bun:sqlite'

export interface VisualFrame {
  base64: string
  timestamp: number
  detectedElements: string[]
  appState: string
  terminalActivity: string
}

export class VisionContextEngine {
  private db: Database
  private lastFrame: VisualFrame | null = null
  private predictiveCache: Map<string, any> = new Map()

  async init() {
    this.db = new Database(':memory:')
    this.db.run(`CREATE TABLE IF NOT EXISTS visual_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      frame_summary TEXT,
      detected_elements TEXT,
      app_state TEXT,
      terminal_activity TEXT,
      timestamp INTEGER
    )`)
    this.db.run(`CREATE TABLE IF NOT EXISTS predictive_cache (
      key TEXT PRIMARY KEY,
      data TEXT,
      hit_count INTEGER DEFAULT 1,
      last_access INTEGER
    )`)
  }

  async captureFrame(frame: VisualFrame) {
    this.lastFrame = frame
    this.db.run(
      `INSERT INTO visual_history (frame_summary, detected_elements, app_state, terminal_activity, timestamp)
       VALUES (?, ?, ?, ?, ?)`,
      [frame.detectedElements.join(','), JSON.stringify(frame.detectedElements), frame.appState, frame.terminalActivity, frame.timestamp]
    )
  }

  async predict(context: any): Promise<any> {
    const key = this.buildContextKey(context)
    const cached = this.predictiveCache.get(key)
    if (cached) {
      this.db.run(`UPDATE predictive_cache SET hit_count = hit_count + 1, last_access = ? WHERE key = ?`, [Date.now(), key])
      return cached
    }
    return null
  }

  async preload(keys: string[]) {
    const rows = this.db.query(`SELECT * FROM predictive_cache WHERE key IN (${keys.map(() => '?').join(',')})`).all(...keys) as any[]
    for (const row of rows) {
      try {
        this.predictiveCache.set(row.key, JSON.parse(row.data))
      } catch {}
    }
  }

  async cacheResult(key: string, data: any) {
    this.predictiveCache.set(key, data)
    this.db.run(
      `INSERT OR REPLACE INTO predictive_cache (key, data, hit_count, last_access) VALUES (?, ?, 1, ?)`,
      [key, JSON.stringify(data), Date.now()]
    )
  }

  private buildContextKey(context: any): string {
    const relevant = { tool: context.tool, action: context.action, file: context.file }
    return JSON.stringify(relevant)
  }

  getTerminalActivity(): string {
    return this.lastFrame?.terminalActivity ?? ''
  }

  getAppState(): string {
    return this.lastFrame?.appState ?? ''
  }
}
