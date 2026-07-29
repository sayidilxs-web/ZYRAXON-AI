/**
 * ZYRAXON ADB Proxy Server
 *
 * Bridges ADB commands from mobile app to Android device.
 * Runs on the laptop/desktop, connected to the Android phone via ADB.
 *
 * Flow:
 *   Mobile App → (HTTP) → ADB Proxy → (ADB) → Android Device
 *
 * Usage:
 *   1. Connect phone via USB or Wireless Debugging
 *   2. bun run packages/Mobile/adb-proxy/server.ts
 *   3. Mobile app connects to proxy IP:19090
 */

import { spawn, execSync } from 'child_process'
import { createServer } from 'http'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = 19090
const SCREENSHOT_FILE = join(__dirname, '..', 'temp_screen.png')

function adbCommand(command: string): { stdout: string; stderr: string } {
  try {
    const output = execSync(command, {
      timeout: 30000,
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
    })
    return { stdout: output.trim(), stderr: '' }
  } catch (err: any) {
    return { stdout: err.stdout?.trim() ?? '', stderr: err.stderr?.trim() ?? err.message }
  }
}

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
  const path = url.pathname

  if (req.method === 'GET' && path === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', adb: testAdb() }))
    return
  }

  if (req.method === 'GET' && path === '/screenshot') {
    const result = adbCommand('adb exec-out screencap -p')
    if (result.stderr) {
      res.writeHead(500)
      res.end(JSON.stringify({ error: result.stderr }))
      return
    }
    const base64 = Buffer.from(result.stdout, 'binary').toString('base64')
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ base64 }))
    return
  }

  if (req.method === 'POST' && path === '/adb') {
    let body = ''
    for await (const chunk of req) body += chunk
    const { command, device } = JSON.parse(body)

    let fullCommand: string
    if (device && !device.includes('127.0.0.1')) {
      fullCommand = `adb -s ${device} ${command}`
    } else {
      fullCommand = `adb ${command}`
    }

    const result = adbCommand(fullCommand)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(result))
    return
  }

  res.writeHead(404)
  res.end('Not found')
})

function testAdb(): boolean {
  try {
    const result = adbCommand('adb devices')
    return result.stdout.includes('device') && !result.stdout.includes('unauthorized')
  } catch {
    return false
  }
}

console.log(`
╔══════════════════════════════════════════╗
║  ZYRAXON ADB Proxy Server              ║
║  Port: ${PORT}                           ║
║  Status: ${testAdb() ? 'ADB Connected ✓' : 'ADB Not Found ✗'}  ║
╚══════════════════════════════════════════╝
`)
console.log(`Connect mobile app to: http://YOUR_LAPTOP_IP:${PORT}`)

if (!testAdb()) {
  console.log(`
⚠  ADB not detected. To connect your Android phone:
   1. Enable Developer Options → USB Debugging
   2. Connect via USB or:
      adb pair 192.168.x.x:xxxxx
      adb connect 192.168.x.x:xxxxx
  `)
}

server.listen(PORT, '0.0.0.0')
