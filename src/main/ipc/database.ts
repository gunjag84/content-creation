import { ipcMain } from 'electron'
import { getDatabase } from '../db/index'

export function registerDatabaseIPC() {
  ipcMain.handle('db:status', async () => {
    try {
      const db = getDatabase()

      // Count tables
      const tables = db
        .prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'")
        .get() as { count: number }

      // Run integrity check
      const check = db.prepare('PRAGMA quick_check').get() as { quick_check: string }

      return {
        ok: check.quick_check === 'ok',
        tables: tables.count
      }
    } catch (err) {
      return {
        ok: false,
        tables: 0
      }
    }
  })
}
