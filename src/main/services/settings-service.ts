import fs from 'fs/promises'
import path from 'path'
import { app } from 'electron'
import { Settings, SettingsSchema, DEFAULT_SETTINGS } from '@shared/types/settings'

export class SettingsService {
  private basePath: string
  private settingsPath: string
  private versionsPath: string

  constructor(basePath?: string) {
    this.basePath = basePath || app.getPath('userData')
    this.settingsPath = path.join(this.basePath, 'settings.json')
    this.versionsPath = path.join(this.basePath, 'versions')
  }

  async load(): Promise<Settings> {
    try {
      const data = await fs.readFile(this.settingsPath, 'utf-8')
      const parsed = JSON.parse(data)
      // Merge with defaults to backfill fields added in later phases
      const merged = { ...DEFAULT_SETTINGS, ...parsed }
      const validated = SettingsSchema.parse(merged)
      return validated
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        // First launch - save defaults and return them
        await this.save(DEFAULT_SETTINGS)
        return DEFAULT_SETTINGS
      }
      throw new Error(`Failed to load settings: ${err.message}`)
    }
  }

  async save(settings: Settings): Promise<void> {
    // Validate first
    const validated = SettingsSchema.parse(settings)

    // Create versions directory
    await fs.mkdir(this.versionsPath, { recursive: true })

    // Copy current settings to versions (if exists)
    try {
      const currentData = await fs.readFile(this.settingsPath, 'utf-8')
      const timestamp = Date.now()
      const versionPath = path.join(this.versionsPath, `settings_${timestamp}.json`)
      await fs.writeFile(versionPath, currentData, 'utf-8')
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        // Only throw if error is not "file doesn't exist"
        throw err
      }
    }

    // Write new settings
    await fs.writeFile(this.settingsPath, JSON.stringify(validated, null, 2), 'utf-8')
  }

  async getVersions(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.versionsPath)
      return files.filter((f) => f.startsWith('settings_') && f.endsWith('.json')).sort().reverse()
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return []
      }
      throw err
    }
  }

  async loadVersion(filename: string): Promise<Settings> {
    const versionPath = path.join(this.versionsPath, filename)
    const data = await fs.readFile(versionPath, 'utf-8')
    const parsed = JSON.parse(data)
    const validated = SettingsSchema.parse(parsed)
    return validated
  }
}
