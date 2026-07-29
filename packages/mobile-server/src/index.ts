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
    const tests: any[] = []

    // Test with the FULL mobile agent system prompt
    const { MOBILE_AGENT_SYSTEM_PROMPT } = await import('./system-prompt')
    const r1 = await fetch('https://opencode.ai/zen/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'mimo-v2.5-free', messages: [{ role: 'system', content: MOBILE_AGENT_SYSTEM_PROMPT }, { role: 'user', content: 'say hello in one word' }], max_tokens: 256 }),
    })
    const b1 = await r1.text()
    tests.push({ name: 'FULL-system-prompt', status: r1.status, body: b1.slice(0, 200), ok: r1.ok, len: b1.length })

    // Test with the same body but as a string literal
    const r2 = await fetch('https://opencode.ai/zen/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: '{"model":"mimo-v2.5-free","messages":[{"role":"system","content":"You are ZYRAXON AI Mobile Agent. Respond with JSON."},{"role":"user","content":"hi"}],"max_tokens":256}',
    })
    const b2 = await r2.text()
    tests.push({ name: 'string-literal', status: r2.status, body: b2.slice(0, 200), ok: r2.ok })

    // Test: just the system prompt prefix
    const r3 = await fetch('https://opencode.ai/zen/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'mimo-v2.5-free', messages: [{ role: 'system', content: MOBILE_AGENT_SYSTEM_PROMPT.slice(0, 500) }, { role: 'user', content: 'hi' }], max_tokens: 256 }),
    })
    const b3 = await r3.text()
    tests.push({ name: 'sys-first-500', status: r3.status, body: b3.slice(0, 200), ok: r3.ok })

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
