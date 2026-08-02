import { type Component, For, Show } from "solid-js"
import type { RecentActivity as RecentActivityType } from "../types"

interface RecentActivityProps {
  activities: RecentActivityType[]
  loading?: boolean
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date()
  const then = new Date(timestamp)
  const diff = now.getTime() - then.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export const RecentActivity: Component<RecentActivityProps> = (props) => {
  return (
    <div class="bg-[#161b22] border border-[#21262d] rounded-xl p-4">
      <h3 class="text-sm font-semibold text-[#c9d1d9] mb-4">Recent Activity</h3>

      <Show
        when={!props.loading}
        fallback={
          <div class="space-y-3">
            <For each={[1, 2, 3]}>
              {() => (
                <div class="flex items-center gap-3 animate-pulse">
                  <div class="w-8 h-8 rounded-full bg-[#21262d]" />
                  <div class="flex-1">
                    <div class="h-3 bg-[#21262d] rounded w-3/4 mb-1" />
                    <div class="h-2 bg-[#21262d] rounded w-1/2" />
                  </div>
                </div>
              )}
            </For>
          </div>
        }
      >
        <ul class="space-y-3">
          <For each={props.activities}>
            {(activity) => (
              <li class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-full bg-[#21262d] flex items-center justify-center shrink-0 mt-0.5">
                  <span class="text-xs text-[#8b949e] font-medium uppercase">{activity.type.charAt(0)}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-[#c9d1d9]">
                    <span class="font-medium">{activity.name}</span>
                    <span class="text-[#8b949e]"> by </span>
                    <span class="text-[#58a6ff]">{activity.author}</span>
                  </p>
                  <p class="text-xs text-[#484f58]">{formatTimeAgo(activity.timestamp)}</p>
                </div>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  )
}
