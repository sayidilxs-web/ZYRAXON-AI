import { Linking, Platform, Alert } from 'react-native'

export async function openApp(appName: string): Promise<boolean> {
  const urlSchemes: Record<string, string> = {
    youtube: 'youtube://',
    chrome: 'googlechrome://',
    whatsapp: 'whatsapp://',
    gmail: 'googlegmail://',
    maps: 'maps://',
    twitter: 'twitter://',
    instagram: 'instagram://',
    facebook: 'fb://',
    settings: 'app-settings:',
    phone: 'tel:',
  }

  const scheme = urlSchemes[appName.toLowerCase()]
  if (scheme) {
    const supported = await Linking.canOpenURL(scheme)
    if (supported) {
      await Linking.openURL(scheme)
      return true
    }
  }
  return false
}

export async function openUrl(url: string): Promise<void> {
  const fullUrl = url.startsWith('http') ? url : `https://${url}`
  const supported = await Linking.canOpenURL(fullUrl)
  if (supported) {
    await Linking.openURL(fullUrl)
  } else {
    Alert.alert('Error', `Cannot open: ${url}`)
  }
}

export function getDeviceInfo() {
  return {
    platform: Platform.OS,
    version: Platform.Version,
    isAndroid: Platform.OS === 'android',
    isIOS: Platform.OS === 'ios',
  }
}
