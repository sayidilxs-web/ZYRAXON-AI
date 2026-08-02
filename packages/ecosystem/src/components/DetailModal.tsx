import { type Component, createSignal, Show, For } from "solid-js"
import type { EcosystemItem, Comment } from "../types"
import { LikeButton } from "./LikeButton"
import { ShareButton } from "./ShareButton"
import { CommentSection } from "./CommentSection"
import { IconX, IconStar, IconDownload, IconCheck } from "./Icons"

interface DetailModalProps {
  item: EcosystemItem | null
  onClose: () => void
  onInstall?: (item: EcosystemItem) => void
}

const typeColors: Record<string, string> = {
  plugin: "bg-[#238636]/20 text-[#3fb950]",
  bot: "bg-[#8957e5]/20 text-[#bc8cff]",
  template: "bg-[#1f6feb]/20 text-[#58a6ff]",
  model: "bg-[#f0883e]/20 text-[#f0883e]",
  tool: "bg-[#3fb950]/20 text-[#3fb950]",
  sdk: "bg-[#58a6ff]/20 text-[#58a6ff]",
  api: "bg-[#e3b341]/20 text-[#e3b341]",
  app: "bg-[#f778ba]/20 text-[#f778ba]",
  extension: "bg-[#79c0ff]/20 text-[#79c0ff]",
  cli: "bg-[#8b949e]/20 text-[#c9d1d9]",
  workflow: "bg-[#d2a8ff]/20 text-[#d2a8ff]",
}

export const DetailModal: Component<DetailModalProps> = (props) => {
  const [isInstalling, setIsInstalling] = createSignal(false)
  const [isInstalled, setIsInstalled] = createSignal(false)
  const [comments, setComments] = createSignal<Comment[]>([])

  const handleInstall = () => {
    if (!props.item || isInstalled() || isInstalling()) return
    setIsInstalling(true)
    const item = props.item

    if (item.installCommand) {
      navigator.clipboard.writeText(item.installCommand)
      setIsInstalling(false)
      setIsInstalled(true)
      props.onInstall?.(item)
      return
    }

    const url = item.downloadUrl || item.liveDemo || item.githubRepo || item.repository
    if (url) {
      window.open(url, "_blank")
      setIsInstalling(false)
      setIsInstalled(true)
      props.onInstall?.(item)
      return
    }

    setTimeout(() => {
      setIsInstalling(false)
      setIsInstalled(true)
      props.onInstall?.(item)
    }, 1500)
  }

  const handleBackdropClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains("modal-backdrop")) {
      props.onClose()
    }
  }

  const handleCommentAdded = (comment: Comment) => {
    setComments([comment, ...comments()])
  }

  return (
    <Show when={props.item}>
      <div
        class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div class="bg-[#161b22] border border-[#21262d] rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
          <div class="flex items-center justify-between p-6 border-b border-[#21262d]">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-xl bg-[#21262d] flex items-center justify-center text-2xl font-bold text-[#58a6ff]">
                {props.item!.name.charAt(0)}
              </div>
              <div>
                <h2 class="text-xl font-semibold text-[#c9d1d9]">{props.item!.name}</h2>
                <p class="text-sm text-[#8b949e]">by {props.item!.author}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={props.onClose}
              class="p-2 hover:bg-[#21262d] rounded-lg transition-colors text-[#8b949e] hover:text-[#c9d1d9]"
            >
              <IconX size={18} />
            </button>
          </div>

          <div class="p-6 overflow-y-auto max-h-[60vh]">
            <div class="flex items-center gap-4 mb-6">
              <span
                class={`px-3 py-1 rounded-full text-xs font-medium ${typeColors[props.item!.type] || "bg-[#30363d] text-[#8b949e]"}`}
              >
                {props.item!.type}
              </span>
              <span class="flex items-center gap-1 text-sm text-[#e3b341]">
                <IconStar size={14} /> {props.item!.rating.toFixed(1)} ({props.item!.reviews} reviews)
              </span>
              <span class="flex items-center gap-1 text-sm text-[#8b949e]">
                <IconDownload size={14} /> {props.item!.downloads.toLocaleString()} downloads
              </span>
              <LikeButton
                itemId={props.item!.id}
                initialLikeCount={props.item!.likeCount}
              />
              <ShareButton
                itemId={props.item!.id}
                itemName={props.item!.name}
              />
            </div>

            <p class="text-[#c9d1d9] mb-6 leading-relaxed">{props.item!.description}</p>

            <div class="mb-6">
              <h3 class="text-sm font-medium text-[#c9d1d9] mb-2">Tags</h3>
              <div class="flex flex-wrap gap-2">
                <For each={props.item!.tags}>
                  {(tag) => (
                    <span class="px-3 py-1 bg-[#21262d] rounded-full text-sm text-[#8b949e]">{tag}</span>
                  )}
                </For>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="p-4 bg-[#0d1117] rounded-lg">
                <p class="text-xs text-[#8b949e] mb-1">Version</p>
                <p class="text-sm text-[#c9d1d9]">{props.item!.version}</p>
              </div>
              <div class="p-4 bg-[#0d1117] rounded-lg">
                <p class="text-xs text-[#8b949e] mb-1">Last Updated</p>
                <p class="text-sm text-[#c9d1d9]">{new Date(props.item!.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div class="border-t border-[#21262d] pt-6">
              <h3 class="text-sm font-medium text-[#c9d1d9] mb-4">Comments ({comments().length})</h3>
              <CommentSection
                itemId={props.item!.id}
                comments={comments()}
                onCommentAdded={handleCommentAdded}
              />
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 p-6 border-t border-[#21262d] bg-[#0d1117]">
            <Show when={props.item!.githubRepo || props.item!.repository}>
              <a
                href={props.item!.githubRepo || props.item!.repository}
                target="_blank"
                rel="noopener noreferrer"
                class="px-4 py-2 text-sm text-[#c9d1d9] hover:bg-[#21262d] rounded-lg transition-colors"
              >
                Source Code
              </a>
            </Show>
            <Show when={props.item!.liveDemo}>
              <a
                href={props.item!.liveDemo}
                target="_blank"
                rel="noopener noreferrer"
                class="px-4 py-2 text-sm text-[#58a6ff] hover:bg-[#21262d] rounded-lg transition-colors"
              >
                Live Demo
              </a>
            </Show>
            <Show
              when={!isInstalled()}
              fallback={
                <span class="flex items-center gap-1 px-4 py-2 bg-[#238636]/20 text-[#3fb950] rounded-lg text-sm font-medium">
                  <IconCheck size={14} /> {props.item!.installCommand ? "Copied!" : "Opened"}
                </span>
              }
            >
              <button
                type="button"
                onClick={handleInstall}
                disabled={isInstalling()}
                class={`px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white ${
                  isInstalling()
                    ? "bg-[#21262d] text-[#8b949e] cursor-wait"
                    : "bg-[#238636] hover:bg-[#2ea043]"
                }`}
              >
                {isInstalling() ? "Installing..." : props.item!.installCommand ? "Copy Command" : "Install"}
              </button>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  )
}
