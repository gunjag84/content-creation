import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import type { SlidePreset } from '@shared/types/generation'

export class PresetsService {
  private presetsPath: string

  constructor(basePath?: string) {
    const base = basePath || app.getPath('userData')
    this.presetsPath = path.join(base, 'presets.json')
  }

  loadPresets(): SlidePreset[] {
    try {
      if (!fs.existsSync(this.presetsPath)) return []
      const data = fs.readFileSync(this.presetsPath, 'utf-8')
      return JSON.parse(data)
    } catch {
      return []
    }
  }

  savePreset(preset: SlidePreset): void {
    const presets = this.loadPresets()
    const existingIndex = presets.findIndex((p) => p.id === preset.id)
    if (existingIndex >= 0) {
      presets[existingIndex] = preset
    } else {
      presets.push(preset)
    }
    fs.writeFileSync(this.presetsPath, JSON.stringify(presets, null, 2), 'utf-8')
  }

  deletePreset(id: string): void {
    const presets = this.loadPresets().filter((p) => p.id !== id)
    fs.writeFileSync(this.presetsPath, JSON.stringify(presets, null, 2), 'utf-8')
  }
}
