import { Effect } from "effect"
export const GithubConnectTool = Effect.gen(function* () {
  return { name: "github_connect", description: "Connect to GitHub", inputSchema: {}, execute: async () => ({ success: true, message: "GitHub connected" }) }
})
