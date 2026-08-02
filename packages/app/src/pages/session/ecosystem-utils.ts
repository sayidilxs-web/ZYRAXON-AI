type ItemCategory = "website" | "sdk" | "pdf" | "ai_bot" | "plugin" | "template" | "mobile_app" | "api"

interface CreatedItem {
  id: string
  name: string
  category: ItemCategory
  status: "draft" | "published"
  createdAt: string
  description?: string
  url?: string
}

const STORAGE_KEY = "zyraxon_ecosystem_items"

export function addItemToEcosystem(item: Omit<CreatedItem, "id" | "createdAt" | "status">): CreatedItem {
  const newItem: CreatedItem = {
    ...item,
    id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: "draft",
    createdAt: new Date().toISOString(),
  }

  const stored = localStorage.getItem(STORAGE_KEY)
  const items: CreatedItem[] = stored ? JSON.parse(stored) : []
  items.unshift(newItem)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))

  window.dispatchEvent(
    new CustomEvent("zyraxon:item-created", {
      detail: newItem,
    })
  )

  return newItem
}

export function publishItemFromEcosystem(itemId: string): boolean {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return false

  const items: CreatedItem[] = JSON.parse(stored)
  const item = items.find((i) => i.id === itemId)
  if (!item) return false

  item.status = "published"
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))

  window.dispatchEvent(
    new CustomEvent("zyraxon:item-published", {
      detail: item,
    })
  )

  return true
}

export function getEcosystemItems(): CreatedItem[] {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

export function getDraftItems(): CreatedItem[] {
  return getEcosystemItems().filter((item) => item.status === "draft")
}

export function getPublishedItems(): CreatedItem[] {
  return getEcosystemItems().filter((item) => item.status === "published")
}

export function removeItemFromEcosystem(itemId: string): boolean {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return false

  const items: CreatedItem[] = JSON.parse(stored)
  const filtered = items.filter((i) => i.id !== itemId)
  if (filtered.length === items.length) return false

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))

  window.dispatchEvent(
    new CustomEvent("zyraxon:item-removed", {
      detail: { id: itemId },
    })
  )

  return true
}

export function clearPublishedItems(): void {
  const items = getEcosystemItems().filter((item) => item.status !== "published")
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))

  window.dispatchEvent(new CustomEvent("zyraxon:items-cleared"))
}

export function autoPublishItem(item: Omit<CreatedItem, "id" | "createdAt" | "status">): CreatedItem {
  const newItem: CreatedItem = {
    ...item,
    id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: "published",
    createdAt: new Date().toISOString(),
  }

  const stored = localStorage.getItem(STORAGE_KEY)
  const items: CreatedItem[] = stored ? JSON.parse(stored) : []
  items.unshift(newItem)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))

  window.dispatchEvent(
    new CustomEvent("zyraxon:item-created", {
      detail: newItem,
    })
  )

  window.dispatchEvent(
    new CustomEvent("zyraxon:item-published", {
      detail: newItem,
    })
  )

  return newItem
}
