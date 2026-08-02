import { type Component, createSignal, Show, For } from "solid-js"
import type { Comment } from "../types"
import { getAuthState } from "../services/auth"
import { getGitHubStorage } from "../services/github-data"
import { getAIConnection } from "../services/ai-connection"
import { IconHeart, IconSend } from "./Icons"

interface CommentSectionProps {
  itemId: string
  comments: Comment[]
  onCommentAdded?: (comment: Comment) => void
}

export const CommentSection: Component<CommentSectionProps> = (props) => {
  const [newComment, setNewComment] = createSignal("")
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  const auth = getAuthState()

  const handleSubmit = async () => {
    if (!newComment().trim() || isSubmitting() || !auth.user) return

    setIsSubmitting(true)
    try {
      const storage = getGitHubStorage()
      const ai = getAIConnection()

      const comment: Comment = {
        id: `comment-${Date.now()}`,
        userId: auth.user.id,
        username: auth.user.username,
        avatarUrl: auth.user.avatarUrl,
        content: newComment().trim(),
        itemId: props.itemId,
        createdAt: new Date().toISOString(),
        likeCount: 0,
      }

      if (storage) {
        await storage.addComment(comment)
      }

      if (ai.isConnected()) {
        await ai.syncUserData({ type: "comment", itemId: props.itemId, content: newComment().trim() })
        await ai.addToMemoryContext({ type: "user_comment", itemId: props.itemId, content: newComment().trim() })
      }

      props.onCommentAdded?.(comment)
      setNewComment("")
    } catch (error) {
      console.error("Failed to add comment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit()
    }
  }

  return (
    <div class="space-y-4">
      <Show when={auth.isAuthenticated}>
        <div class="flex gap-3">
          <img src={auth.user?.avatarUrl} alt="" class="w-8 h-8 rounded-full bg-[#21262d]" />
          <div class="flex-1">
            <textarea
              value={newComment()}
              onInput={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a comment..."
              class="w-full p-3 bg-[#0d1117] border border-[#21262d] rounded-lg text-sm text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] resize-none"
              rows={3}
            />
            <div class="flex justify-end mt-2">
              <button
                onClick={handleSubmit}
                disabled={!newComment().trim() || isSubmitting()}
                class={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  newComment().trim() && !isSubmitting()
                    ? "bg-[#238636] hover:bg-[#2ea043] text-white"
                    : "bg-[#21262d] text-[#484f58] cursor-not-allowed"
                }`}
              >
                <IconSend size={12} />
                {isSubmitting() ? "Posting..." : "Comment"}
              </button>
            </div>
          </div>
        </div>
      </Show>

      <Show when={!auth.isAuthenticated}>
        <div class="p-4 bg-[#0d1117] border border-[#21262d] rounded-lg text-center">
          <p class="text-sm text-[#8b949e]">
            <a href="/ecosystem" class="text-[#58a6ff] hover:underline">Login</a> to leave a comment
          </p>
        </div>
      </Show>

      <div class="space-y-4">
        <For each={props.comments}>
          {(comment) => (
            <div class="flex gap-3">
              <img src={comment.avatarUrl} alt="" class="w-8 h-8 rounded-full bg-[#21262d]" />
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-[#c9d1d9]">{comment.username}</span>
                  <span class="text-xs text-[#484f58]">{formatTimeAgo(comment.createdAt)}</span>
                </div>
                <p class="text-sm text-[#c9d1d9] mt-1">{comment.content}</p>
                <div class="flex items-center gap-4 mt-2">
                  <button class="flex items-center gap-1 text-xs text-[#8b949e] hover:text-[#c9d1d9] transition-colors">
                    <IconHeart size={12} /> {comment.likeCount}
                  </button>
                  <button class="text-xs text-[#8b949e] hover:text-[#c9d1d9] transition-colors">Reply</button>
                </div>
              </div>
            </div>
          )}
        </For>
      </div>

      <Show when={props.comments.length === 0}>
        <div class="text-center py-8">
          <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#161b22] border border-[#21262d] flex items-center justify-center">
            <IconSend size={18} class="text-[#484f58]" />
          </div>
          <p class="text-sm text-[#8b949e]">No comments yet. Be the first!</p>
        </div>
      </Show>
    </div>
  )
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
