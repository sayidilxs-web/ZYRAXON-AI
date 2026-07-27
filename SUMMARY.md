# ZYRAXON-AI PROJECT SUMMARY

## Project Overview
- **Name**: ZYRAXON-AI
- **Version**: 1.17.0
- **License**: BSL-1.1
- **Repository**: https://github.com/onelpawarai/ZYRAXON-AI
- **Description**: AI-powered development tool with 136+ MCP tools, YouTube streaming, self-healing, and cross-platform support

## Directory Structure

```
ZYRAXON-AI-main/
├── packages/
│   ├── opencode/          # Core AI engine (Bun + TypeScript)
│   ├── desktop/           # Electron desktop app (SolidJS)
│   ├── app/               # Web app (SolidJS)
│   ├── cli/               # CLI interface
│   ├── client/            # API client
│   ├── core/              # Core utilities
│   ├── enterprise/        # Enterprise features
│   ├── llm/               # LLM integrations
│   ├── mobile/            # Mobile app
│   ├── plugin/            # Plugin system
│   ├── protocol/          # Communication protocols
│   ├── schema/            # Data schemas
│   ├── sdk/               # SDK exports
│   ├── server/            # Server components
│   ├── session-ui/        # Session UI components
│   ├── tui/               # Terminal UI
│   └── ui/                # Shared UI components
├── script/                # Build scripts
├── docs/                  # Documentation
├── specs/                 # Specifications
├── infra/                 # Infrastructure
├── package.json           # Root workspace config
└── turbo.json             # Turborepo config
```

## Key Packages

### 1. packages/opencode (Core AI Engine)
- **Path**: `C:\Users\MMP\Downloads\ZYRAXON-AI-main\ZYRAXON-AI-main\packages\opencode`
- **Package name**: `zyraxon`
- **Entry point**: `src/index.ts`
- **Build output**: `dist/node/node.js` (server bundle for desktop)
- **Scripts**:
  - `bun run build` → Builds server bundle
  - `bun run dev` → Starts interactive TUI
  - `bun run typecheck` → TypeScript checking

#### Source Structure (src/)
```
src/
├── agent/                 # Agent system (9 modes)
│   ├── agent.ts           # Agent registry + VisionContext management
│   ├── prompt/            # Agent prompts (vision.txt, etc.)
│   └── subagent-permissions.ts
├── screen/                # Vision system (NEW)
│   ├── capture-engine.ts  # PowerShell screenshot capture
│   ├── frame-memory.ts    # Frame storage/memory
│   ├── frame-processor.ts # Frame processing
│   ├── vision-analyzer.ts # Scene analysis
│   ├── vision-context.ts  # VisionContextManager singleton
│   ├── vision-mode.ts     # VisionMode orchestrator
│   └── auto-vision.ts     # Auto vision injection
├── session/               # Session management
│   └── prompt.ts          # Message handling + vision injection
├── provider/              # LLM providers
│   ├── transform.ts       # Message transformation
│   └── provider.ts        # Model capabilities
├── memory/                # Memory system
│   └── auto-injection.ts  # Auto memory injection
├── tool/                  # Tool definitions
├── config/                # Configuration
├── mcp/                   # MCP server integration
└── ...                    # Other modules
```

### 2. packages/desktop (Electron Desktop App)
- **Path**: `C:\Users\MMP\Downloads\ZYRAXON-AI-main\ZYRAXON-AI-main\packages\desktop`
- **Package name**: `@zyraxon-ai/desktop`
- **Entry point**: `src/main/index.ts`
- **Build output**: `out/` (main + preload + renderer)
- **EXE output**: `dist/ZYRAXON Dev-win-installer.exe`
- **Scripts**:
  - `bun run build` → Builds desktop app
  - `bun run package:win` → Creates Windows EXE
  - `bun run dev` → Development mode

#### Source Structure (src/)
```
src/
├── main/                 # Electron main process
│   ├── index.ts          # Main entry
│   ├── ipc.ts            # IPC handlers
│   ├── server.ts         # Server integration
│   ├── sidecar.ts        # Sidecar process
│   └── ...               # Window management, updates, etc.
├── preload/              # Preload scripts
│   └── index.ts          # Exposes window.api
├── renderer/             # SolidJS renderer
│   └── index.html        # Entry HTML
└── ...
```

### 3. packages/app (Web App)
- **Path**: `packages/app`
- **Framework**: SolidJS
- **Entry**: `src/index.html`

### 4. packages/cli (CLI Interface)
- **Path**: `packages/cli`
- **Commands**: `bun run dev` starts TUI

### 5. packages/llm (LLM Integrations)
- **Path**: `packages/llm`
- **Purpose**: AI SDK integrations (OpenAI, Google, Anthropic, etc.)

### 6. packages/plugin (Plugin System)
- **Path**: `packages/plugin`
- **Purpose**: Plugin architecture for extensibility

### 7. packages/schema (Data Schemas)
- **Path**: `packages/schema`
- **Purpose**: Shared data models and schemas

### 8. packages/sdk (SDK)
- **Path**: `packages/sdk`
- **Purpose**: JavaScript SDK for external usage

### 9. packages/server (Server)
- **Path**: `packages/server`
- **Purpose**: API server components

### 10. packages/tui (Terminal UI)
- **Path**: `packages/tui`
- **Purpose**: Terminal user interface

### 11. packages/ui (Shared UI)
- **Path**: `packages/ui`
- **Purpose**: Shared UI components

## Vision System (Active Feature)

### Status
- **Files Created**: 8 files in `packages/opencode/src/screen/`
- **Integration**: Modified `prompt.ts` for direct screenshot injection
- **Bug Fixed**: `agent.toLowerCase is not a function` error resolved
- **Current Issue**: EXE build failing with `EPERM: dxcompiler.dll` permission error

### Vision System Files
1. **capture-engine.ts** - PowerShell-based Windows screenshot capture
2. **frame-memory.ts** - Frame storage and memory management
3. **frame-processor.ts** - Frame processing pipeline
4. **vision-analyzer.ts** - Scene analysis and understanding
5. **vision-context.ts** - VisionContextManager singleton
6. **vision-mode.ts** - VisionMode orchestrator
7. **auto-vision.ts** - Auto vision injection
8. **index.ts** - Module exports

### Vision System Flow
1. User sends message
2. `prompt.ts` checks if agent is "vision"
3. If vision agent: capture screenshot via PowerShell
4. Convert screenshot to base64
5. Inject as image content into AI message
6. AI (mimo-v2.5-free) receives and processes image
7. AI responds with screen understanding

## Build Process

### Step 1: Build OpenCode Server
```bash
cd packages/opencode
bun run build
# Output: dist/node/node.js (server bundle)
```

### Step 2: Copy Web UI
```bash
# Copy opencode-web-ui.gen.ts to dist/node/
cp opencode-web-ui.gen.ts dist/node/
```

### Step 3: Build Desktop App
```bash
cd packages/desktop
bun run build
# Output: out/ (main + preload + renderer)
```

### Step 4: Package Windows EXE
```bash
cd packages/desktop
bun run package:win
# Output: dist/ZYRAXON Dev-win-installer.exe
```

## Agent Modes (9 Total)

1. **General** - Default mode for everyday tasks
2. **Build** - Software engineering mode
3. **Plan** - Architecture mode
4. **Beast** - Deep coding mode
5. **PRO** - Professional mode
6. **APEX PREDATOR** - Maximum power mode
7. **DARK EMPEROR** - Ultra mode
8. **Vision** - AI's Eyes (screen capture + analysis)
9. **Pro Builder** - Website creation intelligence

## MCP Tools (136+)

### Categories
- System Intelligence (20 tools)
- Web Intelligence (20 tools)
- Data Processing (20 tools)
- Security Intelligence (20 tools)
- AI Enhancement (20 tools)
- Productivity Power (20 tools)
- ULTRA Tools (8 tools)

## Configuration Files

### Root Level
- `package.json` - Workspace configuration
- `turbo.json` - Turborepo pipeline
- `tsconfig.json` - TypeScript config
- `.gitignore` - Git ignore rules

### packages/opencode
- `package.json` - Package dependencies
- `tsconfig.json` - TypeScript config
- `script/build-node.ts` - Server build script

### packages/desktop
- `package.json` - Package dependencies
- `tsconfig.json` - TypeScript config
- `electron.vite.config.ts` - Vite config for Electron
- `electron-builder.config.ts` - EXE builder config

## Key Scripts

### Build Scripts
- `script/build-node.ts` - Builds OpenCode server
- `script/build.ts` - Main build script

### Desktop Scripts
- `packages/desktop/scripts/prebuild.ts` - Pre-build tasks
- `packages/desktop/scripts/build-wrapper.ts` - Build wrapper

## Dependencies

### Core Technologies
- **Runtime**: Bun 1.3.14
- **Framework**: Electron 42.3.3
- **UI**: SolidJS 1.9.10
- **Language**: TypeScript
- **Build**: Turborepo, Vite
- **Packaging**: electron-builder 26.15.2

### AI/LLM Dependencies
- `ai` (Vercel AI SDK)
- `@ai-sdk/openai`
- `@ai-sdk/google`
- `@ai-sdk/anthropic`
- `@ai-sdk/xai` (for mimo-v2.5)
- `@modelcontextprotocol/sdk`

## Development Workflow

### Local Development
1. Install dependencies: `bun install`
2. Start dev server: `bun run dev:desktop`
3. Open Electron app

### Production Build
1. Build server: `cd packages/opencode && bun run build`
2. Build desktop: `cd packages/desktop && bun run build`
3. Package EXE: `cd packages/desktop && bun run package:win`

### Testing Vision Mode
1. Start app
2. Select "Vision" agent mode
3. Send any message
4. AI should receive live screenshot
5. AI responds with screen understanding

## Known Issues

### EXE Build Permission Error
- **Error**: `EPERM: operation not permitted, unlink 'dxcompiler.dll'`
- **Cause**: Windows file lock (antivirus or previous electron process)
- **Solution**: Kill lingering processes, delete locked file, retry build

### Vision System Bug (Fixed)
- **Error**: `TypeError: agent.toLowerCase is not a function`
- **Cause**: `agent` variable was Object, not String
- **Solution**: `isVisionAgent()` now handles both string and object types

## Git Information

### Branches
- `main` - Primary branch
- `feat/vision-image-injection` - Vision feature branch

### Tags
- `v1.17.0` - Current release

### GitHub
- **Repository**: https://github.com/onelpawarai/ZYRAXON-AI
- **Token**: (stored securely, not committed)
- **Discord**: https://discord.gg/DN4fZCCDJj

## Contact

- **Website**: https://zyraxon.ai
- **Email**: hello@zyraxon.ai
- **Discord**: https://discord.gg/DN4fZCCDJj

## Build Results (July 27, 2026)

### Step 1: packages/opencode build
- **Command**: `cd packages/opencode && bun run build`
- **Status**: SUCCESS
- **Output**: dist/node/node.js (server bundle)
- **Additional**: Ran `bun run script/build-node.ts` to create server bundle
- **Copied**: opencode-web-ui.gen.ts to dist/node/

### Step 2: packages/desktop build
- **Command**: `cd packages/desktop && bun run build`
- **Status**: SUCCESS
- **Output**: out/ (main + preload + renderer)
- **Note**: Initial build failed due to missing dist/node/node.js, fixed after Step 1

### Step 3: EXE Package
- **Command**: `cd packages/desktop && bun run package:win`
- **Status**: SUCCESS
- **Output**: dist/ZYRAXON Dev-win-installer.exe
- **Size**: 122 MB
- **Target**: Windows NSIS installer

### Issues Resolved
1. **EPERM error**: dxcompiler.dll locked by previous process
2. **Missing dist/node/node.js**: Created via build-node.ts script
3. **virtual:opencode-server resolution**: Fixed by creating server bundle

## Last Updated
- **Date**: July 27, 2026
- **Version**: 1.17.0
- **Status**: EXE build complete, ready for testing
