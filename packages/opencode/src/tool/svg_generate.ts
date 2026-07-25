import { Effect } from "effect"
export const SvgGenerateTool = Effect.gen(function* () {
  return { name: "svg_generate", description: "Generate SVG graphics", inputSchema: {}, execute: async () => ({ success: true, message: "SVG generated" }) }
})
