import { MemoryGraphEngine } from './memory-graph'
import { ShadowCloneEngine } from './shadow-clone'
import { VisionContextEngine } from './vision-context'
import { SecretRedactEngine } from './secret-redact'
import { KernelEngine } from './kernel/index'

export class OmniKernel {
  memory = new MemoryGraphEngine()
  shadow = new ShadowCloneEngine()
  vision = new VisionContextEngine()
  security = new SecretRedactEngine()
  kernel = new KernelEngine()

  async init() {
    await this.memory.init()
    await this.shadow.init()
    await this.vision.init()
    await this.security.init()
    await this.kernel.init()
  }

  async processBeforeToolCall(toolName: string, args: any) {
    const sanitized = await this.security.sanitizeContext(args)
    const predicted = await this.vision.predict(sanitized)
    return { sanitized, predicted }
  }

  async processAfterToolCall(toolName: string, result: any, success: boolean) {
    await this.memory.record(toolName, result, success)
    if (success) await this.kernel.learn(toolName, result)
    else await this.shadow.repair(toolName, result)
  }

  async processBeforeFileEdit(filePath: string, content: string) {
    const shadowResult = await this.shadow.dryRun(filePath, content)
    return shadowResult
  }
}
