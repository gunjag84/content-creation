import fs from 'fs/promises'
import path from 'path'
import { app } from 'electron'
import { Settings, SettingsSchema, DEFAULT_SETTINGS } from '@shared/types/settings'
import { insertSettingsVersion, listSettingsVersions } from '../db/queries'

export class SettingsService {
  private basePath: string
  private settingsPath: string
  private versionsPath: string

  constructor(basePath?: string) {
    this.basePath = basePath || app.getPath('userData')
    this.settingsPath = path.join(this.basePath, 'settings.json')
    this.versionsPath = path.join(this.basePath, 'versions')
  }

  /**
   * Deep merge settings objects, preserving defaults for undefined/null values
   */
  private deepMergeSettings(defaults: any, overrides: any): any {
    if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
      // If override is not an object or is an array, use it if defined, else use default
      return overrides !== undefined && overrides !== null ? overrides : defaults
    }

    if (!defaults || typeof defaults !== 'object' || Array.isArray(defaults)) {
      // If default is not an object, use override
      return overrides
    }

    // Both are objects - merge recursively
    const result: any = { ...defaults }
    for (const key of Object.keys(overrides)) {
      const overrideValue = overrides[key]
      const defaultValue = defaults[key]

      if (overrideValue === undefined || overrideValue === null) {
        // Keep the default
        result[key] = defaultValue
      } else if (
        typeof overrideValue === 'object' &&
        !Array.isArray(overrideValue) &&
        typeof defaultValue === 'object' &&
        !Array.isArray(defaultValue)
      ) {
        // Both are objects - recurse
        result[key] = this.deepMergeSettings(defaultValue, overrideValue)
      } else {
        // Use the override (includes arrays, primitives, etc)
        result[key] = overrideValue
      }
    }

    return result
  }

  async load(): Promise<Settings> {
    try {
      const data = await fs.readFile(this.settingsPath, 'utf-8')
      const parsed = JSON.parse(data)
      // Deep merge with defaults to backfill fields added in later phases
      const merged = this.deepMergeSettings(DEFAULT_SETTINGS, parsed)
      const validated = SettingsSchema.parse(merged)

      // Backfill any version files that aren't in the database
      await this.backfillVersions()

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

  /**
   * Backfill existing version files that aren't recorded in SQLite
   */
  private async backfillVersions(): Promise<void> {
    try {
      const existingFiles = await this.getVersions()
      const dbVersions = listSettingsVersions(1)
      const dbFilenames = new Set(dbVersions.map((v) => v.filename))

      for (const filename of existingFiles) {
        if (!dbFilenames.has(filename)) {
          const ts = parseInt(filename.replace('settings_', '').replace('.json', ''))
          if (!isNaN(ts)) {
            insertSettingsVersion(1, filename, ts)
          }
        }
      }
    } catch (err) {
      console.error('Backfill failed:', err)
      // Non-fatal - continue
    }
  }

  async save(settings: Settings): Promise<void> {
    // Validate first
    const validated = SettingsSchema.parse(settings)

    // Create versions directory
    await fs.mkdir(this.versionsPath, { recursive: true })

    // Copy current settings to versions (if exists)
    let versionFilename: string | null = null
    let versionTimestamp: number | null = null
    try {
      const currentData = await fs.readFile(this.settingsPath, 'utf-8')
      const timestamp = Date.now()
      versionFilename = `settings_${timestamp}.json`
      versionTimestamp = timestamp
      const versionPath = path.join(this.versionsPath, versionFilename)
      await fs.writeFile(versionPath, currentData, 'utf-8')

      // Record in SQLite for history UI
      try {
        insertSettingsVersion(1, versionFilename, versionTimestamp)
      } catch (dbErr) {
        console.error('Failed to record settings version in DB:', dbErr)
        // Non-fatal - file version still exists as backup
      }
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
