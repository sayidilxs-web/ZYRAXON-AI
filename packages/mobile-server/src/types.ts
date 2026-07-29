export type ActionType =
  | 'click' | 'double_click' | 'long_press'
  | 'type_text' | 'paste_text'
  | 'scroll_down' | 'scroll_up'
  | 'swipe_left' | 'swipe_right'
  | 'open_app' | 'open_url'
  | 'go_back' | 'go_home' | 'open_recents'
  | 'notification_tap' | 'wait'
  | 'screenshot' | 'speak_text'
  | 'vibrate' | 'set_volume'
  | 'start_camera' | 'stop_camera'

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
