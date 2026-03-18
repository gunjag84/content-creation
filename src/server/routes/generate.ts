import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { assemblePrompt } from '../services/prompt-assembler'
import { loadSettings } from './settings'
import { GenerationResultSchema } from '../../shared/types'

const router = Router()

// Rate guard - prevent concurrent generation
let isGenerating = false

router.post('/', async (req, res) => {
  if (isGenerating) {
    res.status(429).json({ error: 'Generation already in progress' })
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
    return
  }

  const { pillar, theme, mechanic, contentType, impulse } = req.body
  if (!pillar || !theme || !mechanic) {
    res.status(400).json({ error: 'pillar, theme, and mechanic are required' })
    return
  }

  isGenerating = true

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const settings = loadSettings()
  const prompt = assemblePrompt(
    pillar, theme, mechanic,
    impulse || '',
    settings,
    contentType || 'carousel'
  )

  const client = new Anthropic({ apiKey })
  let partialResponse = ''
  let aborted = false

  // SSE disconnect cleanup - abort stream on client disconnect
  // Use res.on('close') not req.on('close') — in Node 18+, req close fires
  // when the request body is consumed + response starts, not on client disconnect.
  res.on('close', () => {
    console.log('[generate] res close fired, aborted:', aborted)
    if (!aborted) {
      aborted = true
      isGenerating = false
    }
  })

  try {
    console.log('[generate] starting Anthropic stream')
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    })

    stream.on('text', (text) => {
      console.log('[generate] text event, aborted:', aborted, 'length:', text.length)
      if (aborted) {
        stream.abort()
        return
      }
      partialResponse += text
      res.write(`data: ${JSON.stringify({ type: 'token', text })}\n\n`)
    })

    await stream.finalMessage()

    if (!aborted) {
      // Strip markdown fences
      const cleaned = partialResponse.trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '')
        .trim()

      const parsed = GenerationResultSchema.safeParse(JSON.parse(cleaned))
      if (!parsed.success) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'Invalid response shape from AI', partial: partialResponse })}\n\n`)
        res.write('data: [DONE]\n\n')
        return
      }
      const result = parsed.data
      res.write(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`)
      res.write('data: [DONE]\n\n')
    }
  } catch (err) {
    console.log('[generate] catch:', (err as Error).message)
    if (!aborted) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: (err as Error).message, partial: partialResponse || undefined })}\n\n`)
    }
  } finally {
    console.log('[generate] finally, aborted:', aborted, 'partial length:', partialResponse.length)
    isGenerating = false
    res.end()
  }
})

export default router
