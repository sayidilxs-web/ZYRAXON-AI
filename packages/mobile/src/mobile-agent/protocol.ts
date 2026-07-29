export type ActionType =
  | 'click'
  | 'double_click'
  | 'long_press'
  | 'type_text'
  | 'paste_text'
  | 'scroll_down'
  | 'scroll_up'
  | 'swipe_left'
  | 'swipe_right'
  | 'open_app'
  | 'open_url'
  | 'go_back'
  | 'go_home'
  | 'open_recents'
  | 'notification_tap'
  | 'wait'
  | 'screenshot'
  | 'start_voice'
  | 'stop_voice'
  | 'start_camera'
  | 'stop_camera'
  | 'vibrate'
  | 'speak_text'
  | 'set_volume'

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
