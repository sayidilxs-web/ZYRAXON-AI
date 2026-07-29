import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

export class MultiFileComposer {
  private fileGraph: Map<string, string[]> = new Map()

  async analyzeDirectory(dirPath: string): Promise<string[]> {
    const entries = await readdir(dirPath, { withFileTypes: true })
    const files: string[] = []
    for (const entry of entries) {
      if (entry.isFile() && /\.(ts|tsx|js|jsx|json)$/.test(entry.name)) {
        files.push(join(dirPath, entry.name))
      }
    }
    return files
  }

  async buildDependencyGraph(files: string[]): Promise<Map<string, string[]>> {
    for (const file of files) {
      try {
        const content = await readFile(file, 'utf-8')
        const imports = this.extractImports(content)
        this.fileGraph.set(file, imports)
      } catch {}
    }
    return this.fileGraph
  }

  getRelatedFiles(filePath: string): string[] {
    const related = new Set<string>()
    const direct = this.fileGraph.get(filePath) || []
    for (const dep of direct) {
      related.add(dep)
      const nested = this.fileGraph.get(dep) || []
      for (const n of nested) related.add(n)
    }
    for (const [file, deps] of this.fileGraph) {
      if (deps.some((d) => filePath.includes(d))) related.add(file)
    }
    return [...related].slice(0, 10)
  }

  private extractImports(content: string): string[] {
    const imports: string[] = []
    const patterns = [
      /from\s+['"]([^'"]+)['"]/g,
      /import\s+['"]([^'"]+)['"]/g,
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    ]
    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(content)) !== null) {
        imports.push(match[1])
      }
    }
    return imports
  }
}
