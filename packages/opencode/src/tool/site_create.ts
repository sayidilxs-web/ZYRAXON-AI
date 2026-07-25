import { Effect } from "effect"

export const SiteCreateTool = Effect.gen(function* () {
  return {
    name: "site_create",
    description: "Create a new website",
    inputSchema: {},
    execute: async () => ({ success: true, message: "Site created" }),
  }
})
