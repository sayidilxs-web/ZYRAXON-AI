export type DeviceAction = 
  | { type: 'click'; x: number; y: number }
  | { type: 'input'; text: string }
  | { type: 'screenshot' }
  | { type: 'scroll'; direction: 'up' | 'down' | 'left' | 'right' }
  | { type: 'wait'; duration: number }

export interface DeviceState {
  screenWidth: number
  screenHeight: number
  currentApp: string
}
