import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { SettingsSchema, type Settings } from '../../shared/types'

const router = Router()
const SETTINGS_PATH = path.join(process.cwd(), 'data', 'settings.json')

function ensureDataDir(): void {
  const dir = path.dirname(SETTINGS_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function loadSettings(): Settings {
  ensureDataDir()
  if (!fs.existsSync(SETTINGS_PATH)) {
    return SettingsSchema.parse({})
  }
  const raw = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'))
  // Migrate: contentStrategy -> hooks
  if (raw.contextDocs && 'contentStrategy' in raw.contextDocs && !('hooks' in raw.contextDocs)) {
    raw.contextDocs.hooks = raw.contextDocs.contentStrategy
    delete raw.contextDocs.contentStrategy
  }
  return SettingsSchema.parse(raw)
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

export { loadSettings }
export default router
