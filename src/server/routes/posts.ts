import { Router } from 'express'
import {
  insertPost, getPost, listPosts, updatePostStatus,
  insertSlide, getSlidesByPost,
  upsertPerformance, getPerformance,
  updateBalanceMatrix, getBalanceMatrix,
  getAvgPerformanceByDimension
} from '../db/queries'
import { recommendContent, generateWarnings, calculatePillarBalance } from '../services/learning-service'
import { loadSettings } from './settings'

const router = Router()

// List posts with pagination
router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50
  const offset = parseInt(req.query.offset as string) || 0
  const posts = listPosts(limit, offset)
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
          zone_overrides: slide.zone_overrides ? JSON.stringify(slide.zone_overrides) : undefined
        })
      }
    }

    // Update balance matrix
    updateBalanceMatrix('pillar', post.pillar)
    updateBalanceMatrix('theme', post.theme)
    updateBalanceMatrix('mechanic', post.mechanic)

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
    if (entries.length === 0) {
      res.json({ recommendation: null, warnings: [] })
      return
    }
    const recommendation = recommendContent(entries)
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
    const dashboard = calculatePillarBalance(entries, targets)
    res.json(dashboard)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// Get stats summary
router.get('/meta/stats', (_req, res) => {
  try {
    const byPillar = getAvgPerformanceByDimension('pillar')
    const byTheme = getAvgPerformanceByDimension('theme')
    const byMechanic = getAvgPerformanceByDimension('mechanic')
    res.json({ byPillar, byTheme, byMechanic })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router
