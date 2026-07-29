export type ActionType =
  // Touch gestures
  | 'click'
  | 'double_click'
  | 'long_press'
  | 'swipe'
  | 'swipe_up'
  | 'swipe_down'
  | 'swipe_left'
  | 'swipe_right'
  | 'pinch_zoom'
  // Text input
  | 'type_text'
  | 'paste_text'
  | 'clear_text'
  | 'press_enter'
  | 'press_delete'
  | 'press_backspace'
  // Navigation
  | 'scroll_down'
  | 'scroll_up'
  | 'scroll_forward'
  | 'scroll_backward'
  | 'go_back'
  | 'go_home'
  | 'go_recents'
  | 'open_recents'
  | 'open_notification'
  | 'open_quick_settings'
  | 'open_power_dialog'
  | 'open_lock_screen'
  | 'open_search'
  | 'open_assist'
  // Apps
  | 'open_app'
  | 'open_url'
  | 'check_app_installed'
  // Checkboxes & toggles
  | 'check'
  | 'uncheck'
  | 'toggle'
  | 'expand'
  | 'collapse'
  // Media
  | 'screenshot'
  | 'take_screenshot'
  // Voice
  | 'start_voice'
  | 'stop_voice'
  | 'start_camera'
  | 'stop_camera'
  // Device
  | 'vibrate'
  | 'speak_text'
  | 'set_volume'
  | 'volume_up'
  | 'volume_down'
  | 'get_battery'
  | 'get_device_info'
  | 'get_installed_apps'
  | 'get_wifi_status'
  | 'get_bluetooth_status'
  | 'get_brightness'
  | 'is_screen_on'
  // Wait
  | 'wait'

export interface DeviceAction {
  type: ActionType
  target?: string
  text?: string
  x?: number
  y?: number
  duration?: number
  description?: string
}

export interface VisionFrame {
  base64: string
  timestamp: number
  type: 'screenshot' | 'camera'
}

export interface AgentRequest {
  message: string
  history: Array<{ role: string; content: string }>
  mode: string
  vision_frames?: VisionFrame[]
  device_info?: {
    platform: string
    screen_width: number
    screen_height: number
    battery_level?: number
    current_app?: string
  }
}

export interface AgentResponse {
  text: string
  actions: DeviceAction[]
  should_screenshot?: boolean
  should_start_camera?: boolean
  should_speak?: boolean
  finish_reason?: string
}

export type AgentEvent =
  | { type: 'screenshot_taken'; base64: string }
  | { type: 'camera_frame'; base64: string }
  | { type: 'voice_input'; text: string }
  | { type: 'action_result'; action: DeviceAction; success: boolean; error?: string }
  | { type: 'error'; message: string }
