# ZYRAXON AI Mobile — Complete Setup Guide

## Overview: Only 1 APK + Cloud Server

| Component | What | How to get |
|-----------|------|-----------|
| **Mobile App (1 APK)** | React Native + AccessibilityService | `npx eas build` |
| **Cloud Server** | AI Agent Server on Render.com | Git push → auto-deploy |
| **API Key** | OpenRouter (free) or OpenAI | Sign up at openrouter.ai |

---

## Step 1: Get API Key (5 minutes)

**OpenRouter (recommended - free credits):**
1. Go to https://openrouter.ai/keys
2. Sign up (Google/GitHub)
3. Create API key
4. Copy the key (starts with `sk-or-...`)

**Free models available:** `qwen/qwen3-coder:free`, `meta-llama/llama-3.3-70b-instruct:free`

---

## Step 2: Deploy Mobile Agent Server on Render (10 minutes)

1. Go to https://dashboard.render.com
2. Sign up with GitHub
3. Click **New +** → **Web Service**
4. Connect GitHub repo → select `ZYRAXON-AI`
5. Configure:
   - **Name:** `zyraxon-mobile-agent`
   - **Root Directory:** `packages/mobile-server`
   - **Runtime:** `Docker`
   - **Build Command:** (leave empty - Dockerfile handles it)
   - **Start Command:** (leave empty)
   - **Instance Type:** Free
6. Add Environment Variables:
   - `PORT` = `3001`
   - `MOBILE_AI_PROVIDER` = `openrouter`
   - `MOBILE_AI_MODEL` = `openrouter/qwen/qwen3-coder:free`
   - `OPENROUTER_API_KEY` = `sk-or-...` (your key)
7. Click **Create Web Service**
8. Wait 2-3 minutes for deploy
9. Your URL will be: `https://zyraxon-mobile-agent.onrender.com`

---

## Step 3: Build Mobile App APK (10 minutes)

**Prerequisites:**
- Node.js installed
- Expo account (sign up at https://expo.dev)

**Commands (run in `packages/mobile/`):**
```bash
# Install dependencies
npm install

# Build APK using EAS Build
npx eas build --platform android --profile preview
```

This will:
1. Upload code to Expo servers
2. Build the APK in cloud
3. Download link sent to your email

**For local build (alternative):**
```bash
npx expo prebuild
cd android
./gradlew assembleRelease
```

---

## Step 4: Setup Phone (5 minutes)

1. **Install APK** on your Android phone
2. **Open Settings → Accessibility → Installed Apps → ZYRAXON AI**
3. **Enable Accessibility Service** (this is what gives REAL tap/scroll control)
4. Open the app → go to **Settings tab**
5. Set **Agent Server URL** to: `https://zyraxon-mobile-agent.onrender.com`
6. Set **Main Server URL** to: `http://localhost:8080` (if running ZYRAXON locally) or same agent URL

---

## How It Works (The Flow)

```
User: "CapCut খুলো"
  ↓
Mobile App → POST /api/mobile/agent → Render Server
  ↓
Render Server → OpenRouter.ai (AI model)
  ↓
AI thinks: "User wants CapCut. Open app."
  ↓
Server returns: {"text":"opening...", "actions":[{"type":"open_app","target":"capcut"}]}
  ↓
Mobile App → AccessibilityService → REAL "am start com.lemon.lvoverseas"
  ↓
App takes screenshot → sends to AI again
  ↓
AI sees CapCut is open → decides next action
  ↓
... continues until task is complete!
```

## Testing Without Cloud

For local testing before deploying to Render:
```bash
cd packages/mobile-server
bun run src/index.ts
# Server runs on http://localhost:3001
# Phone connects via WiFi (use laptop's IP address)
```

---

## Need Help?

The system is designed to be fully autonomous:
- AI reads screen → decides → acts → verifies → continues
- No user interaction needed during task execution
- Supports ANY Android app
- Bengali + English voice commands
