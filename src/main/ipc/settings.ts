import { ipcMain } from 'electron'
import { SettingsService } from '../services/settings-service'
import { listSettingsVersions, getSettingsVersionForPost } from '../db/queries'

export function registerSettingsIPC(settingsService: SettingsService) {
  ipcMain.handle('settings:load', async () => {
    return await settingsService.load()
  })

  ipcMain.handle('settings:save', async (_event, settings) => {
    await settingsService.save(settings)
  })

  ipcMain.handle('settings-versions:list', async () => {
    return listSettingsVersions(1) // Hardcoded brand_id=1
  })

  ipcMain.handle('settings-versions:for-post', async (_event, postId: number) => {
    return getSettingsVersionForPost(postId)
  })
}
