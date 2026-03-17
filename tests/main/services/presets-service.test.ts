import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PresetsService } from '@main/services/presets-service'
import type { SlidePreset } from '@shared/types/generation'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('PresetsService', () => {
  let tempDir: string
  let service: PresetsService

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), 'presets-test-' + Date.now())
    fs.mkdirSync(tempDir, { recursive: true })
    service = new PresetsService(tempDir)
  })

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('loadPresets() returns empty array when presets.json does not exist (VSED-08)', () => {
    const result = service.loadPresets()
    expect(result).toEqual([])
  })

  it('savePreset then loadPresets returns array containing that preset with matching id, name, zone_overrides (VSED-08)', () => {
    const preset: SlidePreset = {
      id: 'preset-1',
      name: 'My Preset',
      zone_overrides: {
        'zone-title': { fontSize: 48, color: '#ffffff' }
      },
      created_at: Date.now()
    }

    service.savePreset(preset)
    const result = service.loadPresets()

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('preset-1')
    expect(result[0].name).toBe('My Preset')
    expect(result[0].zone_overrides['zone-title'].fontSize).toBe(48)
    expect(result[0].zone_overrides['zone-title'].color).toBe('#ffffff')
  })

  it('savePreset twice with same id overwrites (upsert), loadPresets returns 1 entry (VSED-08)', () => {
    const preset: SlidePreset = {
      id: 'preset-1',
      name: 'Original',
      zone_overrides: { 'zone-a': { fontSize: 32 } },
      created_at: Date.now()
    }

    const updated: SlidePreset = {
      id: 'preset-1',
      name: 'Updated',
      zone_overrides: { 'zone-a': { fontSize: 64 } },
      created_at: Date.now()
    }

    service.savePreset(preset)
    service.savePreset(updated)

    const result = service.loadPresets()
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Updated')
    expect(result[0].zone_overrides['zone-a'].fontSize).toBe(64)
  })

  it('deletePreset(id) removes it, loadPresets no longer contains it (VSED-08)', () => {
    const p1: SlidePreset = {
      id: 'preset-1',
      name: 'Keep',
      zone_overrides: {},
      created_at: Date.now()
    }
    const p2: SlidePreset = {
      id: 'preset-2',
      name: 'Delete Me',
      zone_overrides: {},
      created_at: Date.now()
    }

    service.savePreset(p1)
    service.savePreset(p2)
    service.deletePreset('preset-2')

    const result = service.loadPresets()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('preset-1')
  })

  it('savePreset with overlay_opacity persists it correctly in round-trip (VSED-08)', () => {
    const preset: SlidePreset = {
      id: 'preset-with-opacity',
      name: 'Opacity Preset',
      zone_overrides: { 'zone-bg': { fontSize: 24 } },
      overlay_opacity: 0.7,
      created_at: Date.now()
    }

    service.savePreset(preset)
    const result = service.loadPresets()

    expect(result).toHaveLength(1)
    expect(result[0].overlay_opacity).toBe(0.7)
  })
})
