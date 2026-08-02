import { type Component } from "solid-js"
import { Dynamic } from "solid-js/web"
import type { CategoryInfo } from "../types"
import {
  IconRobot, IconExtension, IconTemplate, IconPalette, IconBox, IconRocket,
  IconBolt, IconCpu, IconCode, IconPackage, IconFileText, IconBook, IconGlobe,
  IconSmartphone, IconTerminal, IconMessageSquare, IconDatabase, IconImage,
  IconLayers, IconLayout, IconCategories, IconMonitor, IconDisc, IconType
} from "./Icons"

const iconMap: Record<string, Component<{ class?: string; size?: number }>> = {
  IconRobot, IconExtension, IconTemplate, IconPalette, IconBox, IconRocket,
  IconBolt, IconCpu, IconCode, IconPackage, IconFileText, IconBook, IconGlobe,
  IconSmartphone, IconTerminal, IconMessageSquare, IconDatabase, IconImage,
  IconLayers, IconLayout, IconCategories, IconMonitor, IconDisc, IconType,
}

interface CategoryCardProps {
  category: CategoryInfo
  onClick: () => void
}

export const CategoryCard: Component<CategoryCardProps> = (props) => {
  return (
    <button
      type="button"
      onClick={props.onClick}
      class="flex flex-col items-center justify-center p-4 bg-[#161b22] border border-[#21262d] rounded-xl hover:border-[#58a6ff] hover:bg-[#1c2333] transition-all duration-200 cursor-pointer group"
    >
      <div class="w-12 h-12 rounded-xl bg-[#21262d] group-hover:bg-[#1f6feb]/20 flex items-center justify-center mb-2 transition-colors">
        <Dynamic component={iconMap[props.category.icon] || IconCategories} class="text-[#58a6ff]" size={22} />
      </div>
      <h3 class="text-sm font-medium text-[#c9d1d9] mb-1">{props.category.name}</h3>
      <p class="text-xs text-[#8b949e] text-center line-clamp-2">{props.category.description}</p>
      <span class="mt-2 text-xs text-[#58a6ff]">{props.category.count} items</span>
    </button>
  )
}
