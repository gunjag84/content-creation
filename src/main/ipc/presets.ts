import { ipcMain } from 'electron'
import { PresetsService } from '../services/presets-service'
import type { SlidePreset } from '@shared/types/generation'

export function registerPresetsHandlers(): void {
  const service = new PresetsService()

  ipcMain.handle('presets:list', () => service.loadPresets())
  ipcMain.handle('presets:save', (_event, preset: SlidePreset) => service.savePreset(preset))
  ipcMain.handle('presets:delete', (_event, id: string) => service.deletePreset(id))
}
