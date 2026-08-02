import { type Component, createSignal, onCleanup, onMount } from "solid-js"
import { IconSearch } from "./Icons"

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
}

export const SearchBar: Component<SearchBarProps> = (props) => {
  const [query, setQuery] = createSignal("")
  let inputRef: HTMLInputElement | undefined

  const handleInput = (e: Event) => {
    const value = (e.target as HTMLInputElement).value
    setQuery(value)
    props.onSearch(value)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setQuery("")
      props.onSearch("")
      inputRef?.blur()
    }
  }

  onMount(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        inputRef?.focus()
      }
    }
    document.addEventListener("keydown", handler)
    onCleanup(() => document.removeEventListener("keydown", handler))
  })

  return (
    <div class="relative flex-1 max-w-xl">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <IconSearch class="text-[#8b949e]" size={16} />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={query()}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={props.placeholder || "Search plugins, bots, templates..."}
        class="w-full pl-10 pr-4 py-2.5 bg-[#0d1117] border border-[#21262d] rounded-lg text-sm text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]/50 transition-colors"
      />
      <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <kbd class="hidden sm:inline-flex items-center px-2 py-0.5 text-xs text-[#484f58] bg-[#21262d] rounded font-mono">Ctrl+K</kbd>
      </div>
    </div>
  )
}
