import { type Component, createSignal, onMount } from "solid-js"
import { getAuthState } from "../services/auth"
import { getGitHubStorage } from "../services/github-data"
import { getAIConnection } from "../services/ai-connection"
import { IconHeart, IconHeartOutline } from "./Icons"

interface LikeButtonProps {
  itemId: string
  initialLikeCount: number
  initialLiked?: boolean
  onLikeChange?: (liked: boolean, count: number) => void
}

export const LikeButton: Component<LikeButtonProps> = (props) => {
  const [isLiked, setIsLiked] = createSignal(props.initialLiked || false)
  const [likeCount, setLikeCount] = createSignal(props.initialLikeCount)
  const [isAnimating, setIsAnimating] = createSignal(false)
  const auth = getAuthState()

  onMount(async () => {
    const storage = getGitHubStorage()
    if (storage && auth.isAuthenticated) {
      const liked = await storage.isLiked(props.itemId)
      setIsLiked(liked)
    }
  })

  const handleLike = async () => {
    if (!auth.isAuthenticated) return

    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 300)

    const storage = getGitHubStorage()
    const ai = getAIConnection()

    if (isLiked()) {
      if (storage) await storage.removeLike(props.itemId)
      setIsLiked(false)
      setLikeCount(likeCount() - 1)
      if (ai.isConnected()) {
        await ai.syncUserData({ type: "unlike", itemId: props.itemId })
      }
    } else {
      if (storage) await storage.addLike(props.itemId)
      setIsLiked(true)
      setLikeCount(likeCount() + 1)
      if (ai.isConnected()) {
        await ai.syncUserData({ type: "like", itemId: props.itemId })
      }
    }

    props.onLikeChange?.(isLiked(), likeCount())
  }

  return (
    <button
      onClick={handleLike}
      disabled={!auth.isAuthenticated}
      class={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        isLiked()
          ? "bg-[#f85149]/10 text-[#f85149] hover:bg-[#f85149]/20"
          : "bg-[#21262d] text-[#8b949e] hover:bg-[#30363d] hover:text-[#c9d1d9]"
      } ${isAnimating() ? "scale-110" : "scale-100"}`}
    >
      <span class={`transition-transform ${isAnimating() ? "scale-125" : ""}`}>
        {isLiked() ? <IconHeart size={14} /> : <IconHeartOutline size={14} />}
      </span>
      <span>{likeCount()}</span>
    </button>
  )
}
