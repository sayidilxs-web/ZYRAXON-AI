import type { UiElement, ScreenState, UiElementRole } from './types'

/**
 * Screen Reader - Parses Android UI tree into structured data
 *
 * Reads the AccessibilityNodeInfo tree (via AccessibilityService or uiautomator dump)
 * and converts it into a flat list of clickable/interactable elements with
 * screen coordinates.
 *
 * This is how the AI "sees" what's on screen and decides where to click.
 */

function parseRole(className: string): UiElementRole {
  const cls = className.toLowerCase()
  if (cls.includes('button')) return 'button'
  if (cls.includes('imageview') || cls.includes('image')) return 'image'
  if (cls.includes('edittext') || cls.includes('textfield')) return 'edit_text'
  if (cls.includes('textview') || cls.includes('text')) return 'text'
  if (cls.includes('checkbox')) return 'checkbox'
  if (cls.includes('switch')) return 'switch'
  if (cls.includes('list') || cls.includes('recycler') || cls.includes('listview')) return 'list'
  if (cls.includes('tab')) return 'tab'
  if (cls.includes('menu')) return 'menu_item'
  if (cls.includes('progress')) return 'progress'
  if (cls.includes('slider') || cls.includes('seekbar')) return 'slider'
  if (cls.includes('webview')) return 'web_view'
  if (cls.includes('viewgroup') || cls.includes('layout') || cls.includes('constraint')) return 'view_group'
  return 'unknown'
}

function getElementText(node: any): string | null {
  return node.text || node.contentDescription || null
}

function parseXmlNode(xmlNode: Element, depth = 0): UiElement | null {
  const tag = xmlNode.tagName
  if (tag !== 'node') return null

  const bounds = xmlNode.getAttribute('bounds') || ''
  const boundsMatch = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)]/)
  if (!boundsMatch) return null

  const [_, xStr, yStr, x2Str, y2Str] = boundsMatch
  const x = parseInt(xStr, 10)
  const y = parseInt(yStr, 10)
  const x2 = parseInt(x2Str, 10)
  const y2 = parseInt(y2Str, 10)

  const className = xmlNode.getAttribute('class') || ''
  const text = xmlNode.getAttribute('text') || null
  const contentDesc = xmlNode.getAttribute('content-desc') || null
  const clickable = xmlNode.getAttribute('clickable') === 'true'
  const longClickable = xmlNode.getAttribute('long-clickable') === 'true'
  const scrollable = xmlNode.getAttribute('scrollable') === 'true'
  const checkable = xmlNode.getAttribute('checkable') === 'true'
  const checked = xmlNode.getAttribute('checked') === 'true'
  const focused = xmlNode.getAttribute('focused') === 'true'
  const enabled = xmlNode.getAttribute('enabled') !== 'false'

  // Skip invisible elements
  if (x === 0 && y === 0 && x2 === 0 && y2 === 0) return null
  if (x < 0 || y < 0) return null

  // Skip full-screen view groups (noise)
  if (className.includes('FrameLayout') && x === 0 && y === 0) return null

  const children: UiElement[] = []
  const childNodes = xmlNode.children || []
  for (let i = 0; i < childNodes.length; i++) {
    const child = parseXmlNode(childNodes[i] as Element, depth + 1)
    if (child) children.push(child)
  }

  const id = `element_${x}_${y}_${depth}_${Math.random().toString(36).slice(2, 6)}`

  return {
    id,
    text,
    content_description: contentDesc,
    role: parseRole(className),
    bounds: { x, y, width: x2 - x, height: y2 - y },
    center: { x: Math.round((x + x2) / 2), y: Math.round((y + y2) / 2) },
    clickable,
    long_clickable: longClickable,
    scrollable,
    checkable,
    checked,
    focused,
    enabled,
    package_name: '',
    children,
    depth,
  }
}

export function parseXmlToUiTree(xmlContent: string): ScreenState | null {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlContent, 'text/xml')
    const rootNode = doc.querySelector('hierarchy')
    if (!rootNode) return null

    const packageName = rootNode.getAttribute('package') || ''
    const activityName = rootNode.getAttribute('activity') || ''
    const rotation = parseInt(rootNode.getAttribute('rotation') || '0', 10)

    const elements: UiElement[] = []
    const children = rootNode.children || []
    for (let i = 0; i < children.length; i++) {
      const element = parseXmlNode(children[i] as Element)
      if (element) elements.push(element)
    }

    // Flatten tree to get all interactable elements
    const flatElements = flattenInteractive(elements)

    return {
      package_name: packageName,
      activity_name: activityName,
      elements: flatElements,
      timestamp: Date.now(),
      dimensions: { width: 1080, height: 1920 }, // Will be updated from device
      raw_text: extractAllText(elements).join('\n'),
    }
  } catch (err) {
    console.warn('UI tree parse error:', err)
    return null
  }
}

function flattenInteractive(elements: UiElement[], maxDepth = 10): UiElement[] {
  const result: UiElement[] = []
  function walk(items: UiElement[], depth: number) {
    if (depth > maxDepth) return
    for (const item of items) {
      if (item.clickable || item.long_clickable || item.scrollable || (item.text && item.text.length > 0)) {
        result.push({ ...item, children: [] })
      }
      if (item.children.length > 0) {
        walk(item.children, depth + 1)
      }
    }
  }
  walk(elements, 0)
  return result
}

function extractAllText(elements: UiElement[]): string[] {
  const texts: string[] = []
  function walk(items: UiElement[]) {
    for (const item of items) {
      const t = item.text || item.content_description
      if (t) texts.push(t)
      if (item.children.length > 0) walk(item.children)
    }
  }
  walk(elements)
  return texts
}

/**
 * UI Tree to AI-friendly text description
 * Converts the UI element tree into a text format AI can understand
 */
export function uiTreeToPrompt(screen: ScreenState): string {
  const lines: string[] = [`Screen: ${screen.package_name} / ${screen.activity_name}`, '']

  for (const el of screen.elements) {
    const text = el.text || el.content_description || ''
    const role = el.role.toUpperCase()
    const clickHint = el.clickable ? ' [CLICKABLE]' : ''
    const scrollHint = el.scrollable ? ' [SCROLLABLE]' : ''

    if (el.clickable || (text && text.length > 0)) {
      lines.push(`  ${role}${clickHint}${scrollHint} "${text}" at (${el.center.x}, ${el.center.y})`)
    }
  }

  lines.push('', 'All text on screen:')
  lines.push(screen.raw_text)

  return lines.join('\n')
}

// React Native side: Parse JSON UI tree from AccessibilityService
export function parseAccessibilityJson(jsonData: any): ScreenState | null {
  try {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
    const elements = flattenInteractive(parseJsonElements(data.nodes || []))
    return {
      package_name: data.packageName || '',
      activity_name: data.activityName || '',
      elements,
      timestamp: Date.now(),
      dimensions: { width: data.displayWidth || 1080, height: data.displayHeight || 1920 },
      raw_text: extractAllText(elements).join('\n'),
    }
  } catch {
    return null
  }
}

function parseJsonElements(nodes: any[]): UiElement[] {
  return nodes.map((n: any, i: number) => ({
    id: `ae_${i}_${Date.now()}`,
    text: n.text || null,
    content_description: n.contentDescription || null,
    role: parseRole(n.className || ''),
    bounds: n.bounds || { x: 0, y: 0, width: 0, height: 0 },
    center: n.center || { x: 0, y: 0 },
    clickable: n.clickable || false,
    long_clickable: n.longClickable || false,
    scrollable: n.scrollable || false,
    checkable: n.checkable || false,
    checked: n.checked || false,
    focused: n.focused || false,
    enabled: n.enabled ?? true,
    package_name: n.packageName || '',
    children: n.children ? parseJsonElements(n.children) : [],
    depth: n.depth || 0,
  }))
}
