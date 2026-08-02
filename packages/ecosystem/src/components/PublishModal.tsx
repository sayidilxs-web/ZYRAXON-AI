import { type Component, createSignal, Show, For } from "solid-js"
import type { EcosystemItem, Category } from "../types"
import { publishItem } from "../services/github"
import { getAuthState } from "../services/auth"
import { IconX, IconCheck, IconLoader, IconSparkles, IconRocket } from "./Icons"

interface PublishModalProps {
  isOpen: boolean
  onClose: () => void
  onPublished?: (item: EcosystemItem) => void
  aiGenerated?: Partial<EcosystemItem>
}

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "ai-bots", label: "AI Bots" },
  { id: "plugins", label: "Plugins" },
  { id: "website-templates", label: "Website Templates" },
  { id: "themes", label: "Themes" },
  { id: "components", label: "Components" },
  { id: "startkits", label: "Starter Kits" },
  { id: "workflows", label: "Workflows" },
  { id: "ai-models", label: "AI Models" },
  { id: "tools", label: "Dev Tools" },
  { id: "sdks", label: "SDKs" },
  { id: "types", label: "Type Packages" },
  { id: "pdfs", label: "PDFs" },
  { id: "books", label: "Books" },
  { id: "apis", label: "APIs" },
  { id: "mobile-apps", label: "Mobile Apps" },
  { id: "browser-extensions", label: "Browser Extensions" },
  { id: "cli-tools", label: "CLI Tools" },
  { id: "prompts", label: "AI Prompts" },
  { id: "datasets", label: "Datasets" },
  { id: "icons", label: "Icon Packs" },
  { id: "ui-kits", label: "UI Kits" },
  { id: "landing-pages", label: "Landing Pages" },
]

const TYPE_MAP: Record<string, string> = {
  "ai-bots": "bot", plugins: "plugin", "website-templates": "template", themes: "theme",
  components: "component", startkits: "startkit", workflows: "workflow", "ai-models": "model",
  tools: "tool", sdks: "sdk", types: "plugin", pdfs: "pdf", books: "book",
  apis: "api", "mobile-apps": "app", "browser-extensions": "extension", "cli-tools": "cli",
  prompts: "prompt", datasets: "dataset", icons: "icon", "ui-kits": "ui-kit", "landing-pages": "landing-page",
}

export const PublishModal: Component<PublishModalProps> = (props) => {
  const [step, setStep] = createSignal<"form" | "preview" | "publishing" | "done">("form")
  const [name, setName] = createSignal("")
  const [description, setDescription] = createSignal("")
  const [category, setCategory] = createSignal<Category>("plugins")
  const [version, setVersion] = createSignal("1.0.0")
  const [tags, setTags] = createSignal("")
  const [liveDemo, setLiveDemo] = createSignal("")
  const [coverImage, setCoverImage] = createSignal("")
  const [error, setError] = createSignal("")

  const auth = getAuthState()

  const fillFromAI = () => {
    if (props.aiGenerated) {
      if (props.aiGenerated.name) setName(props.aiGenerated.name)
      if (props.aiGenerated.description) setDescription(props.aiGenerated.description)
      if (props.aiGenerated.category) setCategory(props.aiGenerated.category)
      if (props.aiGenerated.version) setVersion(props.aiGenerated.version)
      if (props.aiGenerated.tags) setTags(props.aiGenerated.tags.join(", "))
      if (props.aiGenerated.liveDemo) setLiveDemo(props.aiGenerated.liveDemo)
      if (props.aiGenerated.coverImage) setCoverImage(props.aiGenerated.coverImage)
    }
  }

  const handlePublish = async () => {
    if (!name().trim() || !description().trim()) {
      setError("Name and description are required")
      return
    }

    setStep("publishing")
    setError("")

    try {
      const tagsList = tags().split(",").map((t) => t.trim()).filter(Boolean)
      const result = await publishItem({
        name: name().trim(),
        description: description().trim(),
        version: version(),
        author: auth.user?.displayName || auth.user?.username || "Anonymous",
        authorAvatar: auth.user?.avatarUrl,
        authorId: auth.user?.id || "anonymous",
        category: category(),
        type: TYPE_MAP[category()] as any || "plugin",
        tags: tagsList,
        downloads: 0,
        rating: 0,
        reviews: 0,
        likeCount: 0,
        commentCount: 0,
        verified: false,
        featured: false,
        repository: "",
        liveDemo: liveDemo() || undefined,
        coverImage: coverImage() || undefined,
        socialLinks: {},
      })

      setStep("done")
      setTimeout(() => {
        props.onPublished?.(result)
        props.onClose()
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Failed to publish")
      setStep("form")
    }
  }

  const handleBackdrop = (e: MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains("modal-backdrop")) {
      props.onClose()
    }
  }

  const resetForm = () => {
    setStep("form")
    setName("")
    setDescription("")
    setCategory("plugins")
    setVersion("1.0.0")
    setTags("")
    setLiveDemo("")
    setCoverImage("")
    setError("")
  }

  return (
    <Show when={props.isOpen}>
      <div class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleBackdrop}>
        <div class="bg-[#161b22] border border-[#21262d] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
          <Show when={step() === "form"}>
            <div class="flex items-center justify-between p-6 border-b border-[#21262d]">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#238636] to-[#1f6feb] flex items-center justify-center">
                  <IconRocket class="text-white" size={20} />
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-[#c9d1d9]">Publish to Ecosystem</h2>
                  <p class="text-xs text-[#8b949e]">Share your creation with the world</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Show when={props.aiGenerated}>
                  <button
                    onClick={fillFromAI}
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-[#8957e5]/20 hover:bg-[#8957e5]/30 text-[#bc8cff] rounded-lg text-xs font-medium transition-colors"
                  >
                    <IconSparkles size={12} />
                    Fill from AI
                  </button>
                </Show>
                <button onClick={props.onClose} class="p-2 hover:bg-[#21262d] rounded-lg text-[#8b949e] hover:text-[#c9d1d9] transition-colors">
                  <IconX size={18} />
                </button>
              </div>
            </div>

            <div class="p-6 overflow-y-auto max-h-[60vh] space-y-4">
              <Show when={error()}>
                <div class="p-3 bg-[#f85149]/10 border border-[#f85149]/20 rounded-lg text-sm text-[#f85149]">{error()}</div>
              </Show>

              <div>
                <label class="block text-sm font-medium text-[#c9d1d9] mb-1.5">Name *</label>
                <input
                  type="text"
                  value={name()}
                  onInput={(e) => setName(e.currentTarget.value)}
                  placeholder="My Awesome Plugin"
                  class="w-full px-3 py-2 bg-[#0d1117] border border-[#21262d] rounded-lg text-sm text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff]"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-[#c9d1d9] mb-1.5">Description *</label>
                <textarea
                  value={description()}
                  onInput={(e) => setDescription(e.currentTarget.value)}
                  placeholder="What does it do? Why should someone use it?"
                  rows={3}
                  class="w-full px-3 py-2 bg-[#0d1117] border border-[#21262d] rounded-lg text-sm text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] resize-none"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-[#c9d1d9] mb-1.5">Category *</label>
                  <select
                    value={category()}
                    onChange={(e) => setCategory(e.currentTarget.value as Category)}
                    class="w-full px-3 py-2 bg-[#0d1117] border border-[#21262d] rounded-lg text-sm text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]"
                  >
                    <For each={CATEGORIES}>
                      {(cat) => <option value={cat.id}>{cat.label}</option>}
                    </For>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-[#c9d1d9] mb-1.5">Version</label>
                  <input
                    type="text"
                    value={version()}
                    onInput={(e) => setVersion(e.currentTarget.value)}
                    placeholder="1.0.0"
                    class="w-full px-3 py-2 bg-[#0d1117] border border-[#21262d] rounded-lg text-sm text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff]"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-[#c9d1d9] mb-1.5">Tags (comma separated)</label>
                <input
                  type="text"
                  value={tags()}
                  onInput={(e) => setTags(e.currentTarget.value)}
                  placeholder="ai, productivity, code"
                  class="w-full px-3 py-2 bg-[#0d1117] border border-[#21262d] rounded-lg text-sm text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff]"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-[#c9d1d9] mb-1.5">Live Demo URL (optional)</label>
                <input
                  type="text"
                  value={liveDemo()}
                  onInput={(e) => setLiveDemo(e.currentTarget.value)}
                  placeholder="https://example.com"
                  class="w-full px-3 py-2 bg-[#0d1117] border border-[#21262d] rounded-lg text-sm text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff]"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-[#c9d1d9] mb-1.5">Cover Image URL (optional)</label>
                <input
                  type="text"
                  value={coverImage()}
                  onInput={(e) => setCoverImage(e.currentTarget.value)}
                  placeholder="https://example.com/image.png"
                  class="w-full px-3 py-2 bg-[#0d1117] border border-[#21262d] rounded-lg text-sm text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff]"
                />
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 p-6 border-t border-[#21262d] bg-[#0d1117]">
              <button
                onClick={props.onClose}
                class="px-4 py-2 text-sm text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (name().trim() && description().trim()) setStep("preview")
                  else setError("Name and description are required")
                }}
                class="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-lg text-sm font-medium transition-colors"
              >
                Preview
              </button>
            </div>
          </Show>

          <Show when={step() === "preview"}>
            <div class="flex items-center justify-between p-6 border-b border-[#21262d]">
              <h2 class="text-lg font-semibold text-[#c9d1d9]">Preview Your Item</h2>
              <button onClick={() => setStep("form")} class="p-2 hover:bg-[#21262d] rounded-lg text-[#8b949e] hover:text-[#c9d1d9] transition-colors">
                <IconX size={18} />
              </button>
            </div>

            <div class="p-6 overflow-y-auto max-h-[60vh]">
              <div class="bg-[#0d1117] border border-[#21262d] rounded-xl overflow-hidden">
                <Show when={coverImage()}>
                  <div class="h-40 relative overflow-hidden">
                    <img src={coverImage()} alt="" class="w-full h-full object-cover" />
                    <div class="absolute inset-0 bg-gradient-to-t from-[#161b22] to-transparent" />
                  </div>
                </Show>
                <Show when={!coverImage()}>
                  <div class="h-32 bg-gradient-to-br from-[#1f6feb] to-[#8957e5] flex items-center justify-center">
                    <span class="text-4xl font-bold text-white/30">{name().charAt(0)}</span>
                  </div>
                </Show>
                <div class="p-5">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="px-2 py-0.5 bg-[#1f6feb]/20 text-[#58a6ff] rounded text-xs font-medium">{category()}</span>
                    <span class="text-xs text-[#484f58]">v{version()}</span>
                  </div>
                  <h3 class="text-lg font-semibold text-[#c9d1d9] mb-1">{name()}</h3>
                  <p class="text-sm text-[#8b949e] mb-3">{description()}</p>
                  <Show when={tags()}>
                    <div class="flex flex-wrap gap-1.5 mb-3">
                      <For each={tags().split(",").map((t) => t.trim()).filter(Boolean)}>
                        {(tag) => (
                          <span class="px-2 py-0.5 bg-[#21262d] rounded text-xs text-[#8b949e]">{tag}</span>
                        )}
                      </For>
                    </div>
                  </Show>
                  <div class="flex items-center gap-2 text-xs text-[#8b949e]">
                    <span>by {auth.user?.displayName || auth.user?.username}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 p-6 border-t border-[#21262d] bg-[#0d1117]">
              <button
                onClick={() => setStep("form")}
                class="px-4 py-2 text-sm text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handlePublish}
                class="flex items-center gap-2 px-6 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg text-sm font-medium transition-colors"
              >
                <IconRocket size={14} />
                Publish Now
              </button>
            </div>
          </Show>

          <Show when={step() === "publishing"}>
            <div class="flex flex-col items-center justify-center py-16">
              <IconLoader class="text-[#58a6ff] mb-4" size={32} />
              <h2 class="text-lg font-semibold text-[#c9d1d9] mb-2">Publishing...</h2>
              <p class="text-sm text-[#8b949e]">Saving to ZYRAXON Ecosystem permanently</p>
            </div>
          </Show>

          <Show when={step() === "done"}>
            <div class="flex flex-col items-center justify-center py-16">
              <div class="w-16 h-16 rounded-full bg-[#238636] flex items-center justify-center mb-4">
                <IconCheck class="text-white" size={32} />
              </div>
              <h2 class="text-lg font-semibold text-[#c9d1d9] mb-2">Published!</h2>
              <p class="text-sm text-[#8b949e]">Your item is now live in the Ecosystem forever</p>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  )
}
