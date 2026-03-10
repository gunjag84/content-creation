import { ipcMain } from 'electron'
import { SettingsService } from '../services/settings-service'

export function registerSettingsIPC(settingsService: SettingsService) {
  ipcMain.handle('settings:load', async () => {
    return await settingsService.load()
  })

  ipcMain.handle('settings:save', async (_event, settings) => {
    await settingsService.save(settings)
  })
}
