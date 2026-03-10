import { ipcMain } from 'electron'
import { SecurityService } from '../services/security-service'

export function registerSecurityIPC(securityService: SecurityService) {
  ipcMain.handle('security:save-key', async (_event, key: string) => {
    await securityService.saveAPIKey(key)
  })

  ipcMain.handle('security:load-key', async () => {
    return await securityService.loadAPIKey()
  })

  ipcMain.handle('security:delete-key', async () => {
    await securityService.deleteAPIKey()
  })
}
