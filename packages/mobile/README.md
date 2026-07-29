# ZYRAXON AI — Mobile Agent System

Android device automation powered by AI. Combines a React Native chat interface with a native Android AccessibilityService for real device control.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                     ☁️ OpenCode.ai (Free AI)                          │
│                                                                        │
│  Direct API call (no server needed!):                                 │
│  POST https://opencode.ai/zen/v1/chat/completions                   │
│  (No Authorization header required)                                   │
│                                                                        │
│  Returns reasoning field with JSON actions                            │
└────────────────────────────────────────────────────────────────────────┘
          │
          │ HTTPS (JSON)
          ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     📱 Android Phone                                  │
│                                                                         │
│  ┌─────────────────────────────────────┐    ┌─────────────────────────┐ │
│  │  APK 1: ZyraxonAutomation (Helper)   │    │  APK 2: ZYRAXON AI    │ │
│  │  (Native Android — Kotlin)           │    │  (Expo / React Native)  │ │
│  │                                      │    │                        │ │
│  │  AccessibilityService + HttpServer   │◄──►│  Chat UI + Agent UI    │ │
│  │  Port 19091 — REST API               │    │                        │ │
│  │                                      │    │  Connects to Helper    │ │
│  │  Endpoints:                          │    │  on port 19091        │ │
│  │  GET  /health                        │    │                        │ │
│  │  GET  /ui-tree          ← UI dump    │    │                        │ │
│  │  GET  /screen-text      ← all text   │    │                        │ │
│  │  POST /click/text       ← tap by txt │    │                        │ │
│  │  POST /click/coordinate ← tap at xy   │    │                        │ │
│  │  POST /swipe            ← swipe      │    │                        │ │
│  │  POST /type             ← type text   │    │                        │ │
│  │  POST /go-back          ← back btn   │    │                        │ │
│  │  POST /go-home          ← home btn   │    │                        │ │
│  │  POST /scroll           ← scroll     │    │                        │ │
│  └─────────────────────────────────────┘    └─────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Two APKs, One System

| Component | What It Does | How It Connects |
|-----------|-------------|-----------------|
| **APK 1: Helper** (`android-automation/`) | Native Android service. Uses AccessibilityService API for REAL touch, scroll, swipe, text input. HTTP server on port 19091. | Main app sends HTTP to `http://127.0.0.1:19091` |
| **APK 2: Main** (`Expo/RN app`) | Chat interface. Calls OpenCode.ai directly for AI, Helper APK for device control. | Calls `opencode.ai/zen/v1` for AI, `:19091` for actions |

### Data Flow

```
User: "Open YouTube"
        │
        ▼
Main App → POST opencode.ai/zen/v1/chat/completions
        │
        │ AI returns reasoning field with JSON:
        │ {"text":"Opening YouTube...","actions":[{"type":"open_app","target":"youtube"}]}
        ▼
Main App parses JSON from reasoning
        │
        ▼
Main App → POST http://127.0.0.1:19091/click/text
        → Helper APK → AccessibilityService → REAL TAP
        │
        ▼
    Loop until done
```

---

## Quick Start (5 Minutes)

```bash
# 1. Clone the repo
git clone https://github.com/onelpawarai/ZYRAXON-AI.git
cd ZYRAXON-AI

# 2. Build Helper APK
cd packages/mobile/android-automation
./gradlew assembleDebug
# Install app-debug.apk on phone → Enable Accessibility Service

# 3. Build Main APK
cd packages/mobile
npm install
npx expo run:android
# Install on phone

# 4. Start chatting!
```

---

## Build Helper APK

```bash
cd packages/mobile/android-automation
./gradlew assembleDebug
```

**Install:**
1. Copy APK to phone
2. Install → Enable Accessibility Service
3. App shows "Server running on port 19091"

---

## Build Main APK

```bash
cd packages/mobile
npm install
eas build --platform android --profile preview
```

Or for local development:
```bash
npx expo start
```

---

## Helper APK Endpoints

Base URL: `http://127.0.0.1:19091`

| Endpoint | Method | Body | Description |
|----------|--------|------|-------------|
| `/health` | GET | — | Server status |
| `/ui-tree` | GET | — | Complete UI tree |
| `/screen-text` | GET | — | All visible text |
| `/click/text` | POST | `{"text":"YouTube","partial":true}` | Click by text |
| `/click/coordinate` | POST | `{"x":500,"y":800}` | Click at coords |
| `/swipe` | POST | `{"x1":100,"y1":500,"x2":800,"y2":500}` | Swipe gesture |
| `/type` | POST | `{"text":"hello"}` | Type text |
| `/scroll` | POST | `{"direction":"forward"}` | Scroll |
| `/go-back` | POST | — | Press Back |
| `/go-home` | POST | — | Press Home |
| `/open-app` | POST | `{"package":"com.youtube"}` | Open app |

---

## Free AI Models

Uses **opencode.ai** — no API keys needed.

| Model | Notes |
|-------|-------|
| `mimo-v2.5-free` | Default, fast, capable |
| `big-pickle` | General purpose |
| `deepseek-v4-flash-free` | Fast responses |

---

## Troubleshooting

**Helper APK not connecting:**
- Enable Accessibility Service in Android Settings
- Make sure Helper app is running

**AI not responding:**
- Check internet connection (required for OpenCode.ai)

**Build errors:**
- Install Android SDK 34
- Run `npm install` in the mobile directory
