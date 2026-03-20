import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { SettingsSchema, type Settings } from '../../shared/types'
import { seedHooks, seedCtas } from '../../shared/data/seed-library'

const router = Router()
const SETTINGS_PATH = path.join(process.cwd(), 'data', 'settings.json')

function ensureDataDir(): void {
  const dir = path.dirname(SETTINGS_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

/** Migrate old matrix model (angles/areas/tonalities) to scenario model */
function migrateSettings(raw: any): any {
  // Detect old format: pillars have `angles` or `allowedTonalities`
  const needsMigration = raw.pillars?.some((p: any) =>
    p.angles || p.allowedTonalities || p.allowedAreas || p.rules !== undefined
  ) || raw.areas || raw.tonalities

  if (!needsMigration) return raw

  // Migrate pillars
  if (raw.pillars) {
    raw.pillars = raw.pillars.map((p: any) => {
      // Convert angles to scenarios
      const scenarios = (p.angles ?? []).map((a: any) => ({
        id: a.id,
        name: a.name,
        description: a.description ?? '',
        antiPatterns: '',
        allowedMethods: p.allowedMethods ?? [],
      }))

      // Synthesize tone from rules text
      const rules = p.rules ?? ''

      return {
        id: p.id,
        name: p.name,
        targetPct: p.targetPct ?? 0,
        promise: '',
        brief: rules,
        tone: '',
        desiredFeeling: '',
        production: { formats: '', visualStyle: '', captionRules: '' },
        scenarios,
        goals: { business: '', communication: '' },
      }
    })
  }

  // Map library items: tonalityIds -> scenarioIds (all scenarios as default)
  const allScenarioIds = (raw.pillars ?? []).flatMap((p: any) =>
    (p.scenarios ?? []).map((s: any) => s.id)
  )

  if (raw.hookLibrary) {
    raw.hookLibrary = raw.hookLibrary.map((item: any) => ({
      ...item,
      scenarioIds: item.scenarioIds ?? allScenarioIds,
      tonalityIds: undefined,
    }))
  }

  if (raw.ctaLibrary) {
    raw.ctaLibrary = raw.ctaLibrary.map((item: any) => ({
      ...item,
      scenarioIds: item.scenarioIds ?? allScenarioIds,
      tonalityIds: undefined,
    }))
  }

  // Add empty new libraries if missing
  if (!raw.situationLibrary) raw.situationLibrary = []
  if (!raw.scienceLibrary) raw.scienceLibrary = []
  if (!raw.situationImageLibrary) raw.situationImageLibrary = []

  // Remove old fields
  delete raw.areas
  delete raw.tonalities

  return raw
}

function loadSettings(): Settings {
  ensureDataDir()
  if (!fs.existsSync(SETTINGS_PATH)) {
    return SettingsSchema.parse({})
  }
  let raw = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'))
  // Migrate: contentStrategy -> hooks
  if (raw.contextDocs && 'contentStrategy' in raw.contextDocs && !('hooks' in raw.contextDocs)) {
    raw.contextDocs.hooks = raw.contextDocs.contentStrategy
    delete raw.contextDocs.contentStrategy
  }
  // Migrate: matrix model -> scenario model
  raw = migrateSettings(raw)
  const parsed = SettingsSchema.parse(raw)
  // One-shot seed: if both libraries are empty, populate from seed data
  if (parsed.hookLibrary.length === 0 && parsed.ctaLibrary.length === 0) {
    parsed.hookLibrary = seedHooks
    parsed.ctaLibrary = seedCtas
  }
  return parsed
}

function saveSettings(settings: Settings): void {
  ensureDataDir()
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2))
}

router.get('/', (_req, res) => {
  try {
    res.json(loadSettings())
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

router.put('/', (req, res) => {
  try {
    const parsed = SettingsSchema.parse(req.body)
    saveSettings(parsed)
    res.json(parsed)
  } catch (err: any) {
    if (err.issues) {
      res.status(400).json({ error: 'Validation failed', issues: err.issues })
    } else {
      res.status(500).json({ error: err.message })
    }
  }
})

// Image upload for situation library
const IMAGES_DIR = path.join(process.cwd(), 'data', 'images')

router.post('/upload-image', async (req, res) => {
  try {
    if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true })

    // Express raw body or multipart - we expect the file as raw buffer with filename in header
    const contentType = req.headers['content-type'] ?? ''
    if (!contentType.includes('multipart/form-data')) {
      res.status(400).json({ error: 'Expected multipart/form-data' })
      return
    }

    // Use busboy-free approach: read the raw body chunks
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    await new Promise<void>((resolve) => req.on('end', resolve))

    const body = Buffer.concat(chunks)
    const boundary = contentType.split('boundary=')[1]
    if (!boundary) {
      res.status(400).json({ error: 'Missing boundary' })
      return
    }

    // Simple multipart parser
    const boundaryBuffer = Buffer.from(`--${boundary}`)
    const parts = splitMultipart(body, boundaryBuffer)
    const filePart = parts.find(p => p.headers['content-disposition']?.includes('filename'))
    if (!filePart) {
      res.status(400).json({ error: 'No file found in upload' })
      return
    }

    const filenameMatch = filePart.headers['content-disposition']?.match(/filename="([^"]+)"/)
    const originalName = filenameMatch?.[1] ?? 'image.jpg'
    const ext = path.extname(originalName) || '.jpg'
    const id = crypto.randomUUID()
    const filename = `${id}${ext}`
    fs.writeFileSync(path.join(IMAGES_DIR, filename), filePart.body)

    res.json({ id, filename, label: originalName.replace(ext, '') })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

router.delete('/image/:id', (req, res) => {
  try {
    const settings = loadSettings()
    const image = settings.situationImageLibrary.find(i => i.id === req.params.id)
    if (image) {
      const filePath = path.join(IMAGES_DIR, image.filename)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// Simple multipart parser helper
interface MultipartPart {
  headers: Record<string, string>
  body: Buffer
}

function splitMultipart(body: Buffer, boundary: Buffer): MultipartPart[] {
  const parts: MultipartPart[] = []
  const CRLF = Buffer.from('\r\n')
  const DOUBLE_CRLF = Buffer.from('\r\n\r\n')

  let pos = 0
  // Skip preamble - find first boundary
  pos = body.indexOf(boundary, pos)
  if (pos < 0) return parts
  pos += boundary.length

  while (pos < body.length) {
    // Check for closing boundary
    if (body[pos] === 0x2d && body[pos + 1] === 0x2d) break // --
    // Skip CRLF after boundary
    if (body[pos] === 0x0d && body[pos + 1] === 0x0a) pos += 2

    // Find header/body separator
    const headerEnd = body.indexOf(DOUBLE_CRLF, pos)
    if (headerEnd < 0) break

    const headerBlock = body.subarray(pos, headerEnd).toString('utf-8')
    const headers: Record<string, string> = {}
    for (const line of headerBlock.split('\r\n')) {
      const colon = line.indexOf(':')
      if (colon > 0) {
        headers[line.substring(0, colon).trim().toLowerCase()] = line.substring(colon + 1).trim()
      }
    }

    const bodyStart = headerEnd + DOUBLE_CRLF.length
    const nextBoundary = body.indexOf(boundary, bodyStart)
    const bodyEnd = nextBoundary > 0 ? nextBoundary - CRLF.length : body.length

    parts.push({ headers, body: body.subarray(bodyStart, bodyEnd) })
    pos = nextBoundary > 0 ? nextBoundary + boundary.length : body.length
  }

  return parts
}

export { loadSettings }
export default router
