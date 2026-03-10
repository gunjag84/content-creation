import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SettingsService } from '@main/services/settings-service'
import { DEFAULT_SETTINGS, SettingsSchema } from '@shared/types/settings'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('SettingsService', () => {
  let tempDir: string
  let service: SettingsService

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), 'settings-test-' + Date.now())
    fs.mkdirSync(tempDir, { recursive: true })
    service = new SettingsService(tempDir)
  })

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('should return DEFAULT_SETTINGS when no settings file exists', async () => {
    const settings = await service.load()
    expect(settings).toEqual(DEFAULT_SETTINGS)
  })

  it('should create settings.json file on first load', async () => {
    await service.load()
    const settingsPath = path.join(tempDir, 'settings.json')
    expect(fs.existsSync(settingsPath)).toBe(true)
  })

  it('should save settings and create versions directory', async () => {
    await service.save(DEFAULT_SETTINGS)

    const settingsPath = path.join(tempDir, 'settings.json')
    const versionsDir = path.join(tempDir, 'versions')

    expect(fs.existsSync(settingsPath)).toBe(true)
    expect(fs.existsSync(versionsDir)).toBe(true)
  })

  it('should create timestamped version file before overwriting', async () => {
    // Save initial settings
    await service.save(DEFAULT_SETTINGS)

    // Wait a bit to ensure different timestamp
    await new Promise((resolve) => setTimeout(resolve, 10))

    // Save again with modified settings
    const modifiedSettings = {
      ...DEFAULT_SETTINGS,
      contentDefaults: {
        ...DEFAULT_SETTINGS.contentDefaults!,
        carouselSlideMin: 5
      }
    }
    await service.save(modifiedSettings)

    const versionsDir = path.join(tempDir, 'versions')
    const versionFiles = fs.readdirSync(versionsDir)

    expect(versionFiles.length).toBeGreaterThan(0)
    expect(versionFiles[0]).toMatch(/^settings_\d+\.json$/)
  })

  it('should validate settings against Zod schema on save', async () => {
    const invalidSettings = {
      ...DEFAULT_SETTINGS,
      contentPillars: {
        generateDemand: 50,
        convertDemand: 50,
        nurtureLoyalty: 50 // Sum is 150, should fail validation
      }
    }

    await expect(service.save(invalidSettings as any)).rejects.toThrow()
  })

  it('should validate settings against Zod schema on load', async () => {
    // Write invalid JSON manually
    const settingsPath = path.join(tempDir, 'settings.json')
    const invalidData = {
      ...DEFAULT_SETTINGS,
      contentPillars: {
        generateDemand: 50,
        convertDemand: 50,
        nurtureLoyalty: 50
      }
    }
    fs.writeFileSync(settingsPath, JSON.stringify(invalidData, null, 2))

    await expect(service.load()).rejects.toThrow()
  })

  it('should load saved settings correctly', async () => {
    const modifiedSettings = {
      ...DEFAULT_SETTINGS,
      contentDefaults: {
        ...DEFAULT_SETTINGS.contentDefaults!,
        carouselSlideMin: 5,
        carouselSlideMax: 12
      }
    }

    await service.save(modifiedSettings)
    const loaded = await service.load()

    expect(loaded.contentDefaults?.carouselSlideMin).toBe(5)
    expect(loaded.contentDefaults?.carouselSlideMax).toBe(12)
  })

  it('should validate that DEFAULT_SETTINGS passes Zod validation', () => {
    expect(() => {
      SettingsSchema.parse(DEFAULT_SETTINGS)
    }).not.toThrow()
  })

  it('should list version files', async () => {
    await service.save(DEFAULT_SETTINGS)
    await new Promise((resolve) => setTimeout(resolve, 10))
    await service.save(DEFAULT_SETTINGS)

    const versions = await service.getVersions()
    expect(versions.length).toBeGreaterThan(0)
  })

  it('should load specific version file', async () => {
    const initialSettings = {
      ...DEFAULT_SETTINGS,
      contentDefaults: {
        ...DEFAULT_SETTINGS.contentDefaults!,
        carouselSlideMin: 3
      }
    }
    await service.save(initialSettings)

    const versions = await service.getVersions()
    if (versions.length > 0) {
      const loaded = await service.loadVersion(versions[0])
      expect(loaded.contentDefaults?.carouselSlideMin).toBe(3)
    }
  })
})
