import { Effect } from "effect"
export const SitePublishTool = Effect.gen(function* () {
  return { name: "site_publish", description: "Publish a website", inputSchema: {}, execute: async () => ({ success: true, message: "Site published" }) }
})
