# ZYRAXON v1.18.0 Release

## Release Date
2026-07-29

## What's New

### Linux Desktop Application
- New and improved UI with enhanced performance
- Better session management
- Updated keyboard shortcuts
- Bug fixes and stability improvements

### Android App (ZYRAXON Automation)
- Accessibility service for Android automation
- HTTP API server on port 19091
- Touch gesture support (tap, swipe, scroll)
- Text input and UI element interaction
- Device information and system controls

## Download Options

### Linux
Choose the package format that matches your distribution:

- **AppImage**: `zyraxon-desktop-linux-x86_64.AppImage`
  - Works on most Linux distributions
  - Make executable: `chmod +x zyraxon-desktop-linux-x86_64.AppImage`
  - Run: `./zyraxon-desktop-linux-x86_64.AppImage`

- **DEB Package**: `zyraxon-desktop-linux-amd64.deb`
  - For Debian/Ubuntu based distributions
  - Install: `sudo dpkg -i zyraxon-desktop-linux-amd64.deb`

- **RPM Package**: `zyraxon-desktop-linux-x86_64.rpm`
  - For Fedora/RHEL/SUSE based distributions
  - Install: `sudo rpm -i zyraxon-desktop-linux-x86_64.rpm`

### Android
- **Automation App (Debug APK)**: `zyraxon-automation-debug.apk`
  - Requires Android 8.0+ (API 26)
  - Install: Transfer to device and install, or use `adb install zyraxon-automation-debug.apk`
  - The app provides accessibility service for home automation control

## API Endpoints

The Android automation app exposes these HTTP endpoints on port 19091:

### GET Requests
- `/health` - Server status
- `/ui-tree` - Complete UI tree JSON
- `/screen-text` - All visible text
- `/foreground-app` - Current app info
- `/device-info` - Device information
- `/battery` - Battery level

### POST Requests
- `/click/text` - Click by text content
- `/click/coordinate` - Click at coordinates
- `/swipe` - Swipe gesture
- `/scroll` - Scroll forward/backward
- `/type` - Type text
- `/go-back` - Press back button
- `/go-home` - Press home button
- `/open-app` - Open app by package name

## Known Issues

- Android Main App APK requires additional setup for standalone use
  - The debug build needs Metro bundler running for JS bundle
  - Release builds will be available in a future update

## System Requirements

### Linux
- 64-bit x86 processor
- 4GB RAM minimum
- 500MB disk space
- GTK 3.24+ runtime

### Android
- Android 8.0 (Oreo) or higher
- 50MB storage space

## Support

For issues and feedback, please open an issue on GitHub.

## License

This software is provided under the BSL-1.1 license.
