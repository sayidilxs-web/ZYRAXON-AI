import { task } from '../../tool/task-manager'

export interface SubTask {
  id: string
  description: string
  command: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: string
}

export class BackgroundLoop {
  private activeLoops: Map<string, SubTask[]> = new Map()

  async spawnParallel(tasks: SubTask[]): Promise<Map<string, SubTask>> {
    const results = new Map<string, SubTask>()
    const running = tasks.map(async (t) => {
      t.status = 'running'
      try {
        const result = await this.executeTask(t)
        t.status = 'completed'
        t.result = result
      } catch (err: any) {
        t.status = 'failed'
        t.result = err.message
      }
      results.set(t.id, t)
    })
    await Promise.all(running)
    return results
  }

  async executeTask(task: SubTask): Promise<string> {
    const { execSync } = await import('node:child_process')
    try {
      const output = execSync(task.command, { timeout: 30000, encoding: 'utf-8' })
      return output.slice(0, 2000)
    } catch (err: any) {
      throw new Error(err.stderr || err.message)
    }
  }

  async startLoop(loopId: string, tasks: SubTask[]) {
    this.activeLoops.set(loopId, tasks)
    const results = await this.spawnParallel(tasks)
    const allCompleted = [...results.values()].every((r) => r.status === 'completed')
    if (allCompleted) {
      this.activeLoops.delete(loopId)
    }
  }

  getLoopStatus(loopId: string): SubTask[] | undefined {
    return this.activeLoops.get(loopId)
  }
}
