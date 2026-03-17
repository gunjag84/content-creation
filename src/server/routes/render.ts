import { Router } from 'express'
import { RenderService } from '../services/render-service'
import { buildSlideHTML } from '../../shared/buildSlideHTML'
import { loadSettings } from './settings'
import type { Slide } from '../../shared/types'
import archiver from 'archiver'

const router = Router()
const renderService = new RenderService()

// Initialize Playwright on first use
let initialized = false
async function ensureInit() {
  if (!initialized) {
    await renderService.init()
    initialized = true
  }
}

router.post('/', async (req, res) => {
  try {
    await ensureInit()
    const { slides, caption } = req.body as { slides: Slide[]; caption?: string }
    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      res.status(400).json({ error: 'slides array is required' })
      return
    }

    const settings = loadSettings()
    const port = process.env.PORT || '3001'
    const baseUrl = `http://localhost:${port}`

    const pngs: Buffer[] = []
    for (const slide of slides) {
      const html = buildSlideHTML({ slide, allSlides: slides, settings, baseUrl })
      const png = await renderService.renderSlide(html)
      pngs.push(png)
    }

    // Return as JSON with base64 data URLs
    const images = pngs.map((buf, i) => ({
      slide_number: i + 1,
      dataUrl: `data:image/png;base64,${buf.toString('base64')}`
    }))

    res.json({ images, caption })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

router.post('/download', async (req, res) => {
  try {
    await ensureInit()
    const { slides, caption } = req.body as { slides: Slide[]; caption?: string }
    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      res.status(400).json({ error: 'slides array is required' })
      return
    }

    const settings = loadSettings()
    const port = process.env.PORT || '3001'
    const baseUrl = `http://localhost:${port}`

    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', 'attachment; filename="post.zip"')

    const archive = archiver('zip', { zlib: { level: 6 } })
    archive.pipe(res)

    for (let i = 0; i < slides.length; i++) {
      const html = buildSlideHTML({ slide: slides[i], allSlides: slides, settings, baseUrl })
      const png = await renderService.renderSlide(html)
      archive.append(png, { name: `slide-${String(i + 1).padStart(2, '0')}.png` })
    }

    if (caption) {
      archive.append(caption, { name: 'caption.txt' })
    }

    await archive.finalize()
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: (err as Error).message })
    }
  }
})

export default router
