import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { assemblePrompt } from '../services/prompt-assembler'
import { loadSettings } from './settings'
import { GenerationResultSchema, type LibraryItem, type SituationItem, type ScienceItem } from '../../shared/types'
import { getBalanceMatrix } from '../db/queries'

const router = Router()

/** Pick the least-used library item matching the scenario, ties broken randomly */
function selectLibraryItem(
  items: LibraryItem[],
  scenarioId: string,
  variableType: string
): LibraryItem | null {
  // Filter by scenario match
  const filtered = items.filter(item =>
    item.scenarioIds.length === 0 || item.scenarioIds.includes(scenarioId)
  )
  if (filtered.length === 0) return items.length > 0 ? items[Math.floor(Math.random() * items.length)] : null

  // Get usage counts from balance_matrix
  const balanceEntries = getBalanceMatrix()
  const usageMap = new Map<string, number>()
  for (const entry of balanceEntries) {
    if (entry.variable_type === variableType) {
      usageMap.set(entry.variable_value, entry.usage_count)
    }
  }

  // Find minimum usage count
  let minUsage = Infinity
  for (const item of filtered) {
    const usage = usageMap.get(item.id) ?? 0
    if (usage < minUsage) minUsage = usage
  }

  // Collect all items with minimum usage, pick randomly
  const candidates = filtered.filter(item => (usageMap.get(item.id) ?? 0) === minUsage)
  return candidates[Math.floor(Math.random() * candidates.length)]
}

/** Pick the least-used situation item matching the scenario */
function selectSituationItem(
  items: SituationItem[],
  scenarioId: string
): SituationItem | null {
  const filtered = items.filter(item =>
    item.scenarioIds.length === 0 || item.scenarioIds.includes(scenarioId)
  )
  if (filtered.length === 0) return null

  const balanceEntries = getBalanceMatrix()
  const usageMap = new Map<string, number>()
  for (const entry of balanceEntries) {
    if (entry.variable_type === 'situation') {
      usageMap.set(entry.variable_value, entry.usage_count)
    }
  }

  let minUsage = Infinity
  for (const item of filtered) {
    const usage = usageMap.get(item.id) ?? 0
    if (usage < minUsage) minUsage = usage
  }

  const candidates = filtered.filter(item => (usageMap.get(item.id) ?? 0) === minUsage)
  return candidates[Math.floor(Math.random() * candidates.length)]
}

/** Pick the least-used science item matching the scenario */
function selectScienceItem(
  items: ScienceItem[],
  scenarioId: string
): ScienceItem | null {
  const filtered = items.filter(item =>
    item.scenarioIds.length === 0 || item.scenarioIds.includes(scenarioId)
  )
  if (filtered.length === 0) return null

  const balanceEntries = getBalanceMatrix()
  const usageMap = new Map<string, number>()
  for (const entry of balanceEntries) {
    if (entry.variable_type === 'science') {
      usageMap.set(entry.variable_value, entry.usage_count)
    }
  }

  let minUsage = Infinity
  for (const item of filtered) {
    const usage = usageMap.get(item.id) ?? 0
    if (usage < minUsage) minUsage = usage
  }

  const candidates = filtered.filter(item => (usageMap.get(item.id) ?? 0) === minUsage)
  return candidates[Math.floor(Math.random() * candidates.length)]
}

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

  const { pillar, scenario, method, contentType, slideCount, impulse } = req.body
  if (!pillar || !method || !scenario) {
    res.status(400).json({ error: 'pillar, scenario, and method are required' })
    return
  }

  isGenerating = true

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const settings = loadSettings()

  // Look up scenario ID for library filtering
  const pillarEntry = settings.pillars.find(p => p.name === pillar)
  const scenarioEntry = pillarEntry?.scenarios.find(s => s.name === scenario)
  const scenarioId = scenarioEntry?.id ?? ''

  // Select from all 4 libraries by scenarioId + least-used
  const selectedHook = selectLibraryItem(settings.hookLibrary ?? [], scenarioId, 'hook')
  const selectedCta = selectLibraryItem(settings.ctaLibrary ?? [], scenarioId, 'cta')
  const selectedSituation = selectSituationItem(settings.situationLibrary ?? [], scenarioId)
  const selectedScience = selectScienceItem(settings.scienceLibrary ?? [], scenarioId)

  // Select image from situation's pool if available
  let selectedImageId: string | null = null
  if (selectedSituation && selectedSituation.imageIds.length > 0) {
    const imageIds = selectedSituation.imageIds
    selectedImageId = imageIds[Math.floor(Math.random() * imageIds.length)]
  }

  const impulseValue = impulse || ''
  console.log('[generate] impulse value:', JSON.stringify(impulseValue), 'length:', impulseValue.length)

  const prompt = assemblePrompt(
    pillar, scenario,
    method,
    settings,
    contentType || 'carousel',
    typeof slideCount === 'number' ? slideCount : undefined,
    selectedHook?.text ?? null,
    selectedCta?.text ?? null,
    selectedSituation?.text ?? null,
    selectedScience ? `${selectedScience.claim} (${selectedScience.source})` : null,
    impulseValue
  )

  console.log('[generate] prompt contains PROMPT GUIDANCE:', prompt.includes('PROMPT GUIDANCE'))

  const client = new Anthropic({ apiKey })
  let partialResponse = ''
  let aborted = false

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

      // Inject library hook into cover slide, library CTA into CTA/last slide
      if (selectedHook) {
        const coverSlide = result.slides.find(s => s.slide_type === 'cover') ?? result.slides[0]
        if (coverSlide) coverSlide.hook_text = selectedHook.text
      }
      if (selectedCta) {
        const ctaSlide = result.slides.find(s => s.slide_type === 'cta') ?? result.slides[result.slides.length - 1]
        if (ctaSlide) ctaSlide.cta_text = selectedCta.text
      }

      const enrichedResult = {
        ...result,
        selectedHookId: selectedHook?.id ?? null,
        selectedCtaId: selectedCta?.id ?? null,
        selectedSituationId: selectedSituation?.id ?? null,
        selectedScienceId: selectedScience?.id ?? null,
        selectedImageId,
      }
      res.write(`data: ${JSON.stringify({ type: 'complete', result: enrichedResult })}\n\n`)
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
