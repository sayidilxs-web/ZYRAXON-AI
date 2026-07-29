export type UiElementRole = 'button' | 'text' | 'image' | 'input' | 'list' | 'checkbox' | 'switch' | 'edit_text' | 'image_button' | 'tab' | 'menu_item' | 'progress' | 'slider' | 'web_view' | 'view_group' | 'unknown'

export interface UiElement {
  id: string
  text: string | null
  content_description: string | null
  role: UiElementRole
  bounds: { x: number; y: number; width: number; height: number }
  center: { x: number; y: number }
  clickable: boolean
  long_clickable: boolean
  scrollable: boolean
  checkable: boolean
  checked: boolean
  focused: boolean
  enabled: boolean
  package_name: string
  children: UiElement[]
  depth: number
}

export interface ScreenState {
  package_name: string
  activity_name: string
  elements: UiElement[]
  timestamp: number
  dimensions: { width: number; height: number }
  raw_text: string
}

export enum AutomationBackend {
  ACCESSIBILITY_SERVICE = 'accessibility',
  ADB = 'adb',
  NONE = 'none',
}

export interface AutomationConfig {
  backend: AutomationBackend
  adbHost?: string
  adbPort?: number
  companionServicePort?: number
}

export type ActionResult = { success: boolean; error?: string; executionTime?: number }
