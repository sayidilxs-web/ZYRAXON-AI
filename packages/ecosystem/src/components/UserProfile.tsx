import { type Component, createSignal, Show, For, createResource, onMount } from "solid-js"
import type { User, EcosystemItem } from "../types"
import { getItemsByAuthor } from "../services/github"
import { getGitHubStorage } from "../services/github-data"
import { getAuthState } from "../services/auth"
import { IconStar, IconDownload, IconHeart, IconUser } from "./Icons"

interface UserProfileProps {
  user: User
  isOwnProfile?: boolean
}

export const UserProfile: Component<UserProfileProps> = (props) => {
  const [isFollowing, setIsFollowing] = createSignal(false)
  const [activeTab, setActiveTab] = createSignal<"items" | "likes" | "about">("items")
  const [editing, setEditing] = createSignal(false)
  const [editName, setEditName] = createSignal("")
  const [editTitle, setEditTitle] = createSignal("")
  const [editBio, setEditBio] = createSignal("")
  const [editLocation, setEditLocation] = createSignal("")
  const [editCompany, setEditCompany] = createSignal("")
  const [editBlog, setEditBlog] = createSignal("")
  const [editSkills, setEditSkills] = createSignal<string[]>([])
  const [newSkill, setNewSkill] = createSignal("")
  const [saving, setSaving] = createSignal(false)
  const [followerCount, setFollowerCount] = createSignal(props.user.followerCount || 0)
  const [followingCount, setFollowingCount] = createSignal(props.user.followingCount || 0)
  const [likedItems, setLikedItems] = createSignal<string[]>([])

  const [items] = createResource(() => props.user.id, getItemsByAuthor)
  const auth = getAuthState()

  onMount(async () => {
    const storage = getGitHubStorage()
    if (storage) {
      try {
        const follows = await storage.getFollows()
        setIsFollowing(follows.following.includes(props.user.id))
        setFollowerCount(follows.followers.length)
        setFollowingCount(follows.following.length)
        const likes = await storage.getLikes()
        setLikedItems(likes)
      } catch {}
    }
  })

  const startEditing = () => {
    setEditName(props.user.displayName)
    setEditTitle((props.user as any).title || "")
    setEditBio(props.user.bio)
    setEditLocation(props.user.location)
    setEditCompany(props.user.company)
    setEditBlog(props.user.blog)
    setEditSkills((props.user as any).skills || [])
    setEditing(true)
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const storage = getGitHubStorage()
      if (storage) {
        const updatedProfile = {
          ...props.user,
          displayName: editName(),
          title: editTitle(),
          bio: editBio(),
          location: editLocation(),
          company: editCompany(),
          blog: editBlog(),
          skills: editSkills(),
        }
        await storage.updateProfile(updatedProfile)
        setEditing(false)
      }
    } catch (err) {
      console.error("Failed to save profile:", err)
    }
    setSaving(false)
  }

  const addSkill = () => {
    const skill = newSkill().trim()
    if (skill && !editSkills().includes(skill)) {
      setEditSkills([...editSkills(), skill])
      setNewSkill("")
    }
  }

  const removeSkill = (skill: string) => {
    setEditSkills(editSkills().filter((s) => s !== skill))
  }

  const handleFollow = async () => {
    const storage = getGitHubStorage()
    if (!storage) return
    try {
      if (isFollowing()) {
        await storage.unfollowUser(props.user.id)
        setIsFollowing(false)
        setFollowerCount((prev) => Math.max(0, prev - 1))
      } else {
        await storage.followUser(props.user.id)
        setIsFollowing(true)
        setFollowerCount((prev) => prev + 1)
      }
    } catch (err) {
      console.error("Follow/unfollow failed:", err)
    }
  }

  return (
    <div class="max-w-4xl mx-auto p-6">
      <div class="bg-[#161b22] border border-[#21262d] rounded-2xl overflow-hidden">
        <div class="h-32 bg-gradient-to-r from-[#1f6feb] to-[#8957e5]" />
        <div class="px-6 pb-6">
          <div class="flex items-end gap-4 -mt-12">
            <div class="relative">
              <img
                src={props.user.avatarUrl}
                alt={props.user.username}
                class="w-24 h-24 rounded-full border-4 border-[#161b22] bg-[#21262d]"
              />
              <Show when={editing()}>
                <div class="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center cursor-pointer">
                  <IconUser class="text-white" size={16} />
                </div>
              </Show>
            </div>
            <div class="flex-1 pb-2">
              <Show when={editing()} fallback={
                <>
                  <h1 class="text-xl font-bold text-[#c9d1d9]">{props.user.displayName}</h1>
                  <p class="text-sm text-[#8b949e]">@{props.user.username}</p>
                  <Show when={(props.user as any).title}>
                    <p class="text-sm text-[#58a6ff] mt-1">{(props.user as any).title}</p>
                  </Show>
                </>
              }>
                <input
                  value={editName()}
                  onInput={(e) => setEditName(e.currentTarget.value)}
                  class="text-xl font-bold text-[#c9d1d9] bg-[#0d1117] border border-[#21262d] rounded-lg px-2 py-1 w-full focus:outline-none focus:border-[#58a6ff]"
                  placeholder="Display Name"
                />
                <input
                  value={editTitle()}
                  onInput={(e) => setEditTitle(e.currentTarget.value)}
                  class="text-sm text-[#58a6ff] bg-[#0d1117] border border-[#21262d] rounded-lg px-2 py-1 w-full mt-1 focus:outline-none focus:border-[#58a6ff]"
                  placeholder="Title (e.g., Full Stack Developer)"
                />
              </Show>
            </div>
            <Show
              when={props.isOwnProfile}
              fallback={
                <button
                  onClick={handleFollow}
                  class={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isFollowing()
                      ? "bg-[#21262d] text-[#c9d1d9] hover:bg-[#30363d]"
                      : "bg-[#238636] hover:bg-[#2ea043] text-white"
                  }`}
                >
                  {isFollowing() ? "Following" : "Follow"}
                </button>
              }
            >
              <Show
                when={editing()}
                fallback={
                  <button
                    onClick={startEditing}
                    class="px-4 py-2 bg-[#21262d] text-[#c9d1d9] rounded-lg text-sm hover:bg-[#30363d] transition-colors"
                  >
                    Edit Profile
                  </button>
                }
              >
                <div class="flex gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    class="px-4 py-2 bg-[#21262d] text-[#c9d1d9] rounded-lg text-sm hover:bg-[#30363d] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveProfile}
                    disabled={saving()}
                    class="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] disabled:bg-[#21262d] text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {saving() ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </Show>
            </Show>
          </div>

          <Show when={editing()}>
            <div class="mt-4 space-y-3">
              <div>
                <label class="text-xs text-[#8b949e] mb-1 block">Bio</label>
                <textarea
                  value={editBio()}
                  onInput={(e) => setEditBio(e.currentTarget.value)}
                  class="w-full bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2 text-sm text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff] resize-none"
                  rows={3}
                  placeholder="Tell the world about yourself..."
                />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-xs text-[#8b949e] mb-1 block">Location</label>
                  <input value={editLocation()} onInput={(e) => setEditLocation(e.currentTarget.value)} class="w-full bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2 text-sm text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]" placeholder="City, Country" />
                </div>
                <div>
                  <label class="text-xs text-[#8b949e] mb-1 block">Company</label>
                  <input value={editCompany()} onInput={(e) => setEditCompany(e.currentTarget.value)} class="w-full bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2 text-sm text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]" placeholder="Company name" />
                </div>
              </div>
              <div>
                <label class="text-xs text-[#8b949e] mb-1 block">Website/Blog</label>
                <input value={editBlog()} onInput={(e) => setEditBlog(e.currentTarget.value)} class="w-full bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2 text-sm text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]" placeholder="https://yourwebsite.com" />
              </div>
              <div>
                <label class="text-xs text-[#8b949e] mb-1 block">Skills</label>
                <div class="flex flex-wrap gap-2 mb-2">
                  <For each={editSkills()}>
                    {(skill) => (
                      <span class="px-2 py-1 bg-[#1f6feb]/20 text-[#58a6ff] rounded-lg text-xs flex items-center gap-1">
                        {skill}
                        <button onClick={() => removeSkill(skill)} class="text-[#8b949e] hover:text-[#c9d1d9]">&times;</button>
                      </span>
                    )}
                  </For>
                </div>
                <div class="flex gap-2">
                  <input
                    value={newSkill()}
                    onInput={(e) => setNewSkill(e.currentTarget.value)}
                    onKeyPress={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill() } }}
                    class="flex-1 bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2 text-sm text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]"
                    placeholder="Add a skill (e.g., React, TypeScript)"
                  />
                  <button onClick={addSkill} class="px-3 py-2 bg-[#21262d] text-[#c9d1d9] rounded-lg text-sm hover:bg-[#30363d] transition-colors">+</button>
                </div>
              </div>
            </div>
          </Show>

          <Show when={!editing()}>
            <Show when={props.user.bio}>
              <p class="mt-4 text-sm text-[#c9d1d9]">{props.user.bio}</p>
            </Show>
            <Show when={(props.user as any).skills?.length > 0}>
              <div class="flex flex-wrap gap-2 mt-3">
                <For each={(props.user as any).skills || []}>
                  {(skill) => (<span class="px-2 py-1 bg-[#1f6feb]/20 text-[#58a6ff] rounded-lg text-xs">{skill}</span>)}
                </For>
              </div>
            </Show>
            <div class="flex items-center gap-6 mt-4 text-sm text-[#8b949e]">
              <Show when={props.user.location}><span>{props.user.location}</span></Show>
              <Show when={props.user.company}><span>{props.user.company}</span></Show>
              <Show when={props.user.blog}>
                <a href={props.user.blog} target="_blank" rel="noopener noreferrer" class="text-[#58a6ff] hover:underline">{props.user.blog}</a>
              </Show>
            </div>
            <div class="flex items-center gap-6 mt-4">
              <div class="text-center">
                <p class="text-lg font-bold text-[#c9d1d9]">{(items() || []).length}</p>
                <p class="text-xs text-[#8b949e]">Published</p>
              </div>
              <div class="text-center">
                <p class="text-lg font-bold text-[#c9d1d9]">{followerCount()}</p>
                <p class="text-xs text-[#8b949e]">Followers</p>
              </div>
              <div class="text-center">
                <p class="text-lg font-bold text-[#c9d1d9]">{followingCount()}</p>
                <p class="text-xs text-[#8b949e]">Following</p>
              </div>
            </div>
          </Show>
        </div>
      </div>

      <div class="mt-6 flex gap-1 border-b border-[#21262d]">
        <button onClick={() => setActiveTab("items")} class={`px-4 py-2 text-sm font-medium transition-colors ${activeTab() === "items" ? "text-[#c9d1d9] border-b-2 border-[#58a6ff]" : "text-[#8b949e] hover:text-[#c9d1d9]"}`}>
          Items
        </button>
        <button onClick={() => setActiveTab("likes")} class={`px-4 py-2 text-sm font-medium transition-colors ${activeTab() === "likes" ? "text-[#c9d1d9] border-b-2 border-[#58a6ff]" : "text-[#8b949e] hover:text-[#c9d1d9]"}`}>
          Likes
        </button>
        <button onClick={() => setActiveTab("about")} class={`px-4 py-2 text-sm font-medium transition-colors ${activeTab() === "about" ? "text-[#c9d1d9] border-b-2 border-[#58a6ff]" : "text-[#8b949e] hover:text-[#c9d1d9]"}`}>
          About
        </button>
      </div>

      <div class="mt-6">
        <Show when={activeTab() === "items"}>
          <Show when={items()} fallback={<div class="grid grid-cols-3 gap-4"><For each={[1, 2, 3]}>{() => <div class="h-48 bg-[#161b22] rounded-xl animate-pulse" />}</For></div>}>
            <div class="grid grid-cols-3 gap-4">
              <For each={items()!}>
                {(item) => (
                  <div class="p-4 bg-[#161b22] border border-[#21262d] rounded-xl hover:border-[#30363d] cursor-pointer transition-colors">
                    <div class="flex items-center gap-3 mb-3">
                      <div class="w-10 h-10 rounded-lg bg-[#21262d] flex items-center justify-center text-sm font-bold text-[#58a6ff]">
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <h3 class="text-sm font-medium text-[#c9d1d9]">{item.name}</h3>
                        <p class="text-xs text-[#8b949e]">{item.version}</p>
                      </div>
                    </div>
                    <p class="text-xs text-[#8b949e] line-clamp-2 mb-3">{item.description}</p>
                    <div class="flex items-center justify-between text-xs text-[#8b949e]">
                      <span class="flex items-center gap-1"><IconStar size={12} class="text-[#e3b341]" /> {item.rating.toFixed(1)}</span>
                      <span class="flex items-center gap-1"><IconDownload size={12} /> {item.downloads.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </Show>

        <Show when={activeTab() === "likes"}>
          <Show when={likedItems().length > 0} fallback={
            <div class="text-center py-12">
              <IconHeart size={40} class="mx-auto text-[#484f58]" />
              <p class="mt-4 text-[#8b949e]">No liked items yet</p>
            </div>
          }>
            <div class="grid grid-cols-3 gap-4">
              <For each={likedItems()}>
                {(itemId) => (
                  <div class="p-4 bg-[#161b22] border border-[#21262d] rounded-xl">
                    <p class="text-xs text-[#8b949e]">Item ID: {itemId}</p>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </Show>

        <Show when={activeTab() === "about"}>
          <div class="bg-[#161b22] border border-[#21262d] rounded-xl p-6">
            <h3 class="text-lg font-semibold text-[#c9d1d9] mb-4">About</h3>
            <Show when={props.user.bio}>
              <p class="text-sm text-[#c9d1d9] mb-4">{props.user.bio}</p>
            </Show>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-[#8b949e]">Joined</p>
                <p class="text-[#c9d1d9]">{new Date(props.user.createdAt).toLocaleDateString()}</p>
              </div>
              <Show when={props.user.location}>
                <div>
                  <p class="text-[#8b949e]">Location</p>
                  <p class="text-[#c9d1d9]">{props.user.location}</p>
                </div>
              </Show>
            </div>
          </div>
        </Show>
      </div>
    </div>
  )
}
