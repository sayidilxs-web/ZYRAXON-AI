import { Effect } from "effect"
export const SiteUnpublishTool = Effect.gen(function* () {
  return { name: "site_unpublish", description: "Unpublish a website", inputSchema: {}, execute: async () => ({ success: true, message: "Site unpublished" }) }
})
