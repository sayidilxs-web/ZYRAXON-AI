import { type Component, Show } from "solid-js"
import type { EcosystemStats } from "../types"
import { IconTrending } from "./Icons"

interface StatsCardProps {
  stats: EcosystemStats | null
  loading?: boolean
}

export const StatsCard: Component<StatsCardProps> = (props) => {
  return (
    <div class="bg-[#161b22] border border-[#21262d] rounded-xl p-4">
      <h3 class="text-sm font-semibold text-[#c9d1d9] mb-4">Marketplace Stats</h3>

      <Show
        when={!props.loading && props.stats}
        fallback={
          <div class="space-y-3">
            <div class="h-8 bg-[#21262d] rounded animate-pulse" />
            <div class="grid grid-cols-2 gap-3">
              <div class="h-16 bg-[#21262d] rounded animate-pulse" />
              <div class="h-16 bg-[#21262d] rounded animate-pulse" />
            </div>
          </div>
        }
      >
        <div class="mb-4">
          <p class="text-2xl font-bold text-[#c9d1d9]">{props.stats!.totalDownloads.toLocaleString()}</p>
          <p class="text-xs text-[#8b949e]">Total Downloads</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="p-3 bg-[#0d1117] rounded-lg">
            <p class="text-lg font-semibold text-[#c9d1d9]">{props.stats!.totalPlugins}</p>
            <p class="text-xs text-[#8b949e]">Plugins</p>
          </div>
          <div class="p-3 bg-[#0d1117] rounded-lg">
            <p class="text-lg font-semibold text-[#c9d1d9]">{props.stats!.totalBots}</p>
            <p class="text-xs text-[#8b949e]">Bots</p>
          </div>
          <div class="p-3 bg-[#0d1117] rounded-lg">
            <p class="text-lg font-semibold text-[#c9d1d9]">{props.stats!.totalTemplates}</p>
            <p class="text-xs text-[#8b949e]">Templates</p>
          </div>
          <div class="p-3 bg-[#0d1117] rounded-lg">
            <p class="text-lg font-semibold text-[#c9d1d9]">{props.stats!.totalUsers}</p>
            <p class="text-xs text-[#8b949e]">Users</p>
          </div>
        </div>
      </Show>
    </div>
  )
}
