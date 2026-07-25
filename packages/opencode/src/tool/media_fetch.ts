import { Effect } from "effect"
export const MediaFetchTool = Effect.gen(function* () {
  return { name: "media_fetch", description: "Fetch media content", inputSchema: {}, execute: async () => ({ success: true, message: "Media fetched" }) }
})
