import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { processAgentRequest } from './ai-agent'
import type { AgentRequest, AgentResponse } from './types'

const app = new Hono()

app.use('/*', cors({ origin: '*', allowHeaders: ['Content-Type'], allowMethods: ['POST', 'GET', 'OPTIONS'] }))

app.get('/health', (c) => c.json({ status: 'ok', service: 'zyraxon-mobile-agent', version: '1.0.0' }))

app.get('/diagnostic', async (c) => {
  try {
    const res = await fetch('https://opencode.ai/zen/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'mimo-v2.5-free', messages: [{ role: 'user', content: 'hi' }], max_tokens: 10 }),
    })
    const status = res.status
    const text = await res.text()
    return c.json({ status, body: text.slice(0, 300), ok: res.ok })
  } catch (err: any) {
    return c.json({ error: err.message })
  }
})

app.get('/diagnostic2', async (c) => {
  try {
    const res = await fetch('https://opencode.ai/zen/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'mimo-v2.5-free', messages: [{ role: 'system', content: 'You are a helpful assistant that replies in one word.' }, { role: 'user', content: 'say hello' }], max_tokens: 10 }),
    })
    const status = res.status
    const text = await res.text()
    let parsed = null
    try { parsed = JSON.parse(text) } catch {}
    return c.json({ status, body: text.slice(0, 500), ok: res.ok, parsed_ok: parsed !== null })
  } catch (err: any) {
    return c.json({ error: err.message })
  }
})

app.get('/diagnostic3', async (c) => {
  try {
    const baseUrl = process.env.OPENCODE_API_URL ?? 'https://opencode.ai/zen/v1'
    const model = process.env.MOBILE_AI_MODEL ?? 'mimo-v2.5-free'

    // Test 1: why does system prompt cause "Not Found"?
    const tests: any[] = []

    // A: short system prompt
    const r1 = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: 'You are a helpful assistant that replies in one word.' }, { role: 'user', content: 'say hello' }], max_tokens: 4096 }),
    })
    tests.push({ name: 'short-sys', status: r1.status, body: (await r1.text()).slice(0, 100) })

    // B: system prompt with JSON template
    const r2 = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: 'Respond with JSON: {"text":"answer"}' }, { role: 'user', content: 'say hello' }], max_tokens: 4096 }),
    })
    tests.push({ name: 'json-sys', status: r2.status, body: (await r2.text()).slice(0, 100) })

    // C: longer system prompt
    const r3 = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: 'You are ZYRAXON AI Mobile Agent. You control Android devices. Respond with JSON.' }, { role: 'user', content: 'say hello' }], max_tokens: 4096 }),
    })
    tests.push({ name: 'zyraxon-sys', status: r3.status, body: (await r3.text()).slice(0, 100) })

    return c.json({ tests })
  } catch (err: any) {
    return c.json({ error: err.message })
  }
})

app.post('/api/mobile/agent', async (c) => {
  try {
    const req: AgentRequest = await c.req.json()
    const response = await processAgentRequest(req)
    return c.json(response)
  } catch (err: any) {
    return c.json({ text: `Server error: ${err.message}`, actions: [], finish_reason: 'error' } as AgentResponse, 500)
  }
})

app.post('/api/mobile/agent/stream', async (c) => {
  try {
    const req: AgentRequest = await c.req.json()
    c.header('Content-Type', 'text/event-stream')
    c.header('Cache-Control', 'no-cache')
    c.header('Connection', 'keep-alive')

    const response = await processAgentRequest(req)
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        const words = response.text.split(' ')
        let idx = 0
        function pushWord() {
          if (idx < words.length) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'token', content: words[idx] + ' ' })}\n\n`))
            idx++
            setTimeout(pushWord, 30)
          } else {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'actions', actions: response.actions })}\n\n`))
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', finish_reason: response.finish_reason })}\n\n`))
            controller.close()
          }
        }
        pushWord()
      },
    })
    return new Response(stream)
  } catch (err: any) {
    return c.json({ text: `Stream error: ${err.message}`, actions: [], finish_reason: 'error' } as AgentResponse, 500)
  }
})

const PORT = parseInt(process.env.PORT ?? '3001', 10)

console.log(`\n╔══════════════════════════════════════╗`)
console.log(`║  ZYRAXON Mobile Agent Server        ║`)
console.log(`║  Port: ${PORT}                        ║`)
console.log(`║  AI: ${process.env.MOBILE_AI_PROVIDER ?? 'opencode'} / ${process.env.MOBILE_AI_MODEL ?? 'mimo-v2.5-free'}  ║`)
console.log(`╚══════════════════════════════════════╝\n`)
console.log(`Mobile Agent API: http://localhost:${PORT}/api/mobile/agent`)
console.log(`Health:           http://localhost:${PORT}/health`)

Bun.serve({
  port: PORT,
  fetch: app.fetch,
})
