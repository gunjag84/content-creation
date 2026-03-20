import { Router } from 'express'
import {
  insertPost, getPost, listPosts, listPostsWithScores, updatePostStatus,
  insertSlide, getSlidesByPost,
  upsertPerformance, getPerformance,
  updateBalanceMatrix, getBalanceMatrix,
  getAvgPerformanceByDimension
} from '../db/queries'
import { recommendContent, generateWarnings, calculateBalance } from '../services/learning-service'
import { loadSettings } from './settings'

const router = Router()

// List posts with pagination (includes performance_score via JOIN)
router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50
  const offset = parseInt(req.query.offset as string) || 0
  const posts = listPostsWithScores(limit, offset)
  res.json(posts)
})

// Get single post with slides and performance
router.get('/:id', (req, res) => {
  const post = getPost(parseInt(req.params.id))
  if (!post) { res.status(404).json({ error: 'Post not found' }); return }
  const slides = getSlidesByPost(post.id)
  const performance = getPerformance(post.id)
  res.json({ post, slides, performance })
})

// Create post with slides
router.post('/', (req, res) => {
  try {
    const { post, slides } = req.body
    const postId = insertPost(post)

    // Insert slides
    if (slides && Array.isArray(slides)) {
      for (const slide of slides) {
        insertSlide({
          post_id: postId,
          slide_number: slide.slide_number,
          slide_type: slide.slide_type,
          hook_text: slide.hook_text,
          body_text: slide.body_text,
          cta_text: slide.cta_text,
          overlay_opacity: slide.overlay_opacity,
          custom_background_path: slide.custom_background_path,
          background_position_x: slide.background_position_x,
          background_position_y: slide.background_position_y,
          background_scale: slide.background_scale,
          zone_overrides: slide.zone_overrides ? JSON.stringify(slide.zone_overrides) : undefined
        })
      }
    }

    // Update balance matrix for all dimensions
    updateBalanceMatrix('pillar', post.pillar)
    if (post.scenario) updateBalanceMatrix('scenario', post.scenario)
    updateBalanceMatrix('method', post.method)
    if (post.selectedHookId) updateBalanceMatrix('hook', post.selectedHookId)
    if (post.selectedCtaId) updateBalanceMatrix('cta', post.selectedCtaId)
    if (post.selectedSituationId) updateBalanceMatrix('situation', post.selectedSituationId)
    if (post.selectedScienceId) updateBalanceMatrix('science', post.selectedScienceId)

    res.json({ id: postId })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// Update post status
router.patch('/:id/status', (req, res) => {
  const { status } = req.body
  if (!['draft', 'approved', 'exported'].includes(status)) {
    res.status(400).json({ error: 'Invalid status' })
    return
  }
  updatePostStatus(parseInt(req.params.id), status)
  res.json({ ok: true })
})

// Upsert performance stats
router.put('/:id/stats', (req, res) => {
  try {
    upsertPerformance(parseInt(req.params.id), req.body)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// Get recommendation
router.get('/meta/recommendation', (_req, res) => {
  try {
    const entries = getBalanceMatrix()
    const settings = loadSettings()

    // Filter to only values present in current settings
    const validPillars = new Set(settings.pillars.map(p => p.name))
    const validScenarios = new Set(settings.pillars.flatMap(p => p.scenarios.map(s => s.name)))
    const validMethods = new Set(settings.methods.map(m => m.name))

    const filtered = entries.filter(e => {
      if (e.variable_type === 'pillar') return validPillars.has(e.variable_value)
      if (e.variable_type === 'scenario') return validScenarios.has(e.variable_value)
      if (e.variable_type === 'method') return validMethods.has(e.variable_value)
      return false
    })

    // Need at least one entry per required dimension
    const hasPillar = filtered.some(e => e.variable_type === 'pillar')
    const hasScenario = filtered.some(e => e.variable_type === 'scenario')
    const hasMethod = filtered.some(e => e.variable_type === 'method')

    if (!hasPillar || !hasScenario || !hasMethod) {
      res.json({ recommendation: null, warnings: [] })
      return
    }

    const recommendation = recommendContent(filtered)
    const warnings = generateWarnings(entries)
    res.json({ recommendation, warnings })
  } catch (err) {
    res.json({ recommendation: null, warnings: [], error: (err as Error).message })
  }
})

// Get balance dashboard data
router.get('/meta/balance', (_req, res) => {
  try {
    const entries = getBalanceMatrix()
    const settings = loadSettings()
    const targets: Record<string, number> = {}
    for (const p of settings.pillars) {
      targets[p.name] = p.targetPct
    }
    const dashboard = calculateBalance(entries, targets)
    res.json(dashboard)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// Get stats summary
router.get('/meta/stats', (_req, res) => {
  try {
    const byPillar = getAvgPerformanceByDimension('pillar')
    const byScenario = getAvgPerformanceByDimension('scenario')
    const byMethod = getAvgPerformanceByDimension('method')
    res.json({ byPillar, byScenario, byMethod })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router
