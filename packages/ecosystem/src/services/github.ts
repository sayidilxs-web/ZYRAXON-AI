import type { EcosystemItem, CategoryInfo, EcosystemStats, RecentActivity, User, Comment } from "../types"
import { getAuthState } from "./auth"

const GITHUB_REPO = "onelpawarai/ZYRAXON-AI"
const GITHUB_API = "https://api.github.com"

function getHeaders() {
  const auth = getAuthState()
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  }
  if (auth?.token) {
    headers.Authorization = `Bearer ${auth.token}`
  }
  return headers
}

async function fetchFromGitHub(path: string, retries = 3): Promise<any> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/contents${path}`, { headers: getHeaders() })
      if (!response.ok) throw new Error(`GitHub API error: ${response.status}`)
      const data = await response.json()
      if (data.content) {
        return JSON.parse(atob(data.content.replace(/\n/g, "")))
      }
      return data
    } catch (err) {
      lastError = err as Error
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500))
      }
    }
  }
  throw lastError
}

async function getFileSha(path: string): Promise<string | null> {
  try {
    const response = await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/contents${path}`, { headers: getHeaders() })
    if (!response.ok) return null
    const data = await response.json()
    return data.sha || null
  } catch {
    return null
  }
}

async function commitToGitHub(path: string, content: any, message: string): Promise<boolean> {
  try {
    const sha = await getFileSha(path)
    const body: Record<string, any> = {
      message,
      content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2)))),
    }
    if (sha) body.sha = sha
    const response = await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/contents${path}`, {
      method: "PUT",
      headers: { ...getHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    return response.ok
  } catch {
    return false
  }
}

async function fetchItemsFromPath(path: string): Promise<EcosystemItem[]> {
  try {
    const data = await fetchFromGitHub(path)
    if (Array.isArray(data)) return data
    if (data.items) return data.items
    return []
  } catch {
    return []
  }
}

let cachedItems: EcosystemItem[] | null = null
let cacheTime = 0
const CACHE_TTL = 30000
const LOCALSTORAGE_KEY = "zyraxon_ecosystem_cache"

function loadLocalCache(): EcosystemItem[] | null {
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed.items) && Date.now() - parsed.time < 300000) {
      return parsed.items
    }
  } catch {}
  return null
}

function saveLocalCache(items: EcosystemItem[]) {
  try {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify({ items, time: Date.now() }))
  } catch {}
}

export async function getAllItems(): Promise<EcosystemItem[]> {
  const now = Date.now()
  if (cachedItems && now - cacheTime < CACHE_TTL) return cachedItems

  const [plugins, bots, templates, published] = await Promise.all([
    fetchItemsFromPath("/marketplace/plugins/index.json"),
    fetchItemsFromPath("/marketplace/bots/index.json"),
    fetchItemsFromPath("/marketplace/templates/index.json"),
    fetchItemsFromPath("/marketplace/published/index.json"),
  ])

  const items = [...plugins, ...bots, ...templates, ...published]
  cachedItems = items
  cacheTime = now
  if (items.length > 0) saveLocalCache(items)
  return items.length > 0 ? items : (loadLocalCache() ?? items)
}

export async function getItemsByCategory(category: string): Promise<EcosystemItem[]> {
  return (await getAllItems()).filter((item) => item.category === category)
}

export async function getItemsByType(type: string): Promise<EcosystemItem[]> {
  return (await getAllItems()).filter((item) => item.type === type)
}

export async function getFeaturedItems(): Promise<EcosystemItem[]> {
  return (await getAllItems()).filter((item) => item.featured)
}

export async function getTopRatedItems(limit: number = 5): Promise<EcosystemItem[]> {
  return (await getAllItems()).sort((a, b) => b.rating - a.rating).slice(0, limit)
}

export async function getTrendingItems(): Promise<EcosystemItem[]> {
  return (await getAllItems()).sort((a, b) => b.downloads - a.downloads)
}

export async function getNewArrivals(): Promise<EcosystemItem[]> {
  return (await getAllItems()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function searchItems(query: string): Promise<EcosystemItem[]> {
  const all = await getAllItems()
  const q = query.toLowerCase()
  return all.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.tags.some((tag) => tag.toLowerCase().includes(q)),
  )
}

export async function getItemById(id: string): Promise<EcosystemItem | undefined> {
  return (await getAllItems()).find((item) => item.id === id)
}

export async function getItemsByAuthor(authorId: string): Promise<EcosystemItem[]> {
  return (await getAllItems()).filter((item) => item.authorId === authorId)
}

export async function getCategories(): Promise<CategoryInfo[]> {
  const all = await getAllItems()
  const categories: CategoryInfo[] = [
    { id: "ai-bots", name: "AI Bots", icon: "IconRobot", description: "Custom AI assistants and chatbots", count: 0 },
    { id: "plugins", name: "Plugins", icon: "IconExtension", description: "Extend ZYRAXON functionality", count: 0 },
    { id: "website-templates", name: "Website Templates", icon: "IconTemplate", description: "Ready-made website starters", count: 0 },
    { id: "themes", name: "Themes", icon: "IconPalette", description: "UI themes and appearance", count: 0 },
    { id: "components", name: "Components", icon: "IconBox", description: "Reusable UI components", count: 0 },
    { id: "startkits", name: "Starter Kits", icon: "IconRocket", description: "Full project starter kits", count: 0 },
    { id: "workflows", name: "Workflows", icon: "IconBolt", description: "Automation workflows", count: 0 },
    { id: "ai-models", name: "AI Models", icon: "IconCpu", description: "Pre-trained models and adapters", count: 0 },
    { id: "tools", name: "Dev Tools", icon: "IconCode", description: "Developer utilities", count: 0 },
    { id: "sdks", name: "SDKs", icon: "IconPackage", description: "Software development kits", count: 0 },
    { id: "types", name: "Type Packages", icon: "IconFileText", description: "TypeScript type definitions", count: 0 },
    { id: "pdfs", name: "PDFs", icon: "IconFileText", description: "Documentation and guides", count: 0 },
    { id: "books", name: "Books", icon: "IconBook", description: "E-books and learning material", count: 0 },
    { id: "apis", name: "APIs", icon: "IconGlobe", description: "API integrations and wrappers", count: 0 },
    { id: "mobile-apps", name: "Mobile Apps", icon: "IconSmartphone", description: "Mobile application templates", count: 0 },
    { id: "browser-extensions", name: "Browser Extensions", icon: "IconExtension", description: "Chrome/Firefox extensions", count: 0 },
    { id: "cli-tools", name: "CLI Tools", icon: "IconTerminal", description: "Command-line utilities", count: 0 },
    { id: "prompts", name: "AI Prompts", icon: "IconMessageSquare", description: "Prompt templates and libraries", count: 0 },
    { id: "datasets", name: "Datasets", icon: "IconDatabase", description: "Training and reference datasets", count: 0 },
    { id: "icons", name: "Icon Packs", icon: "IconImage", description: "Icon sets and SVG packs", count: 0 },
    { id: "ui-kits", name: "UI Kits", icon: "IconLayers", description: "Complete UI design systems", count: 0 },
    { id: "landing-pages", name: "Landing Pages", icon: "IconLayout", description: "Marketing page templates", count: 0 },
    { id: "desktop-apps", name: "Desktop Apps", icon: "IconMonitor", description: "Windows, Mac, Linux applications", count: 0 },
    { id: "iso-images", name: "ISO Images", icon: "IconDisc", description: "Bootable ISO images and system images", count: 0 },
    { id: "fonts", name: "Fonts", icon: "IconType", description: "Custom fonts and typefaces", count: 0 },
    { id: "code-snippets", name: "Code Snippets", icon: "IconCode", description: "Reusable code snippets and patterns", count: 0 },
    { id: "devops", name: "DevOps", icon: "IconRocket", description: "CI/CD, Docker, K8s configs", count: 0 },
  ]
  for (const cat of categories) {
    cat.count = all.filter((item) => item.category === cat.id).length
  }
  return categories
}

export async function getStats(): Promise<EcosystemStats> {
  const all = await getAllItems()
  return {
    totalPlugins: all.filter((item) => item.type === "plugin" || item.category === "plugins").length,
    totalBots: all.filter((item) => item.type === "bot" || item.category === "ai-bots").length,
    totalTemplates: all.filter((item) => item.type === "template" || item.category === "website-templates").length,
    totalDownloads: all.reduce((sum, item) => sum + item.downloads, 0),
    totalUsers: new Set(all.map((item) => item.authorId)).size,
  }
}

export async function getRecentActivity(): Promise<RecentActivity[]> {
  return (await getAllItems())
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10)
    .map((item) => ({
      id: item.id,
      type: item.type as RecentActivity["type"],
      name: item.name,
      author: item.author,
      authorAvatar: item.authorAvatar,
      timestamp: item.updatedAt,
    }))
}

export async function publishItem(item: Omit<EcosystemItem, "id" | "createdAt" | "updatedAt">): Promise<EcosystemItem> {
  const auth = getAuthState()
  if (!auth.isAuthenticated) throw new Error("Not authenticated")

  const newItem: EcosystemItem = {
    ...item,
    id: `${item.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    authorId: auth.user!.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  try {
    let existingItems: EcosystemItem[] = []
    try {
      const data = await fetchFromGitHub("/marketplace/published/index.json")
      existingItems = Array.isArray(data) ? data : data.items || []
    } catch {
      existingItems = []
    }
    existingItems.push(newItem)
    await commitToGitHub("/marketplace/published/index.json", existingItems, `Publish: ${newItem.name} to ZYRAXON Ecosystem`)

    const { getGitHubStorage } = await import("./github-data")
    const storage = getGitHubStorage()
    if (storage) {
      try {
        await storage.addPublishedItem(newItem)
      } catch {}
    }

    cachedItems = null
  } catch (err) {
    console.error("Failed to persist to GitHub:", err)
  }
  return newItem
}

export async function likeItem(itemId: string): Promise<void> {
  const auth = getAuthState()
  if (!auth.isAuthenticated) throw new Error("Not authenticated")
}

export async function unlikeItem(itemId: string): Promise<void> {
  const auth = getAuthState()
  if (!auth.isAuthenticated) throw new Error("Not authenticated")
}

export async function addComment(itemId: string, content: string, parentId?: string): Promise<Comment> {
  const auth = getAuthState()
  if (!auth.isAuthenticated) throw new Error("Not authenticated")
  return {
    id: `comment-${Date.now()}`,
    userId: auth.user!.id,
    username: auth.user!.username,
    avatarUrl: auth.user!.avatarUrl,
    content,
    itemId,
    parentId,
    createdAt: new Date().toISOString(),
    likeCount: 0,
  }
}

export async function followUser(userId: string): Promise<void> {
  const auth = getAuthState()
  if (!auth.isAuthenticated) throw new Error("Not authenticated")
  await commitToGitHub(
    `/marketplace/users/${userId}.json`,
    { followerAdded: auth.user!.id, timestamp: new Date().toISOString() },
    `Follow user: ${userId}`
  )
}

export async function unfollowUser(userId: string): Promise<void> {
  const auth = getAuthState()
  if (!auth.isAuthenticated) throw new Error("Not authenticated")
  await commitToGitHub(
    `/marketplace/users/${userId}.json`,
    { followerRemoved: auth.user!.id, timestamp: new Date().toISOString() },
    `Unfollow user: ${userId}`
  )
}

export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const data = await fetchFromGitHub(`/marketplace/users/${userId}.json`)
    return data
  } catch {
    return null
  }
}
