import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { initDatabase, closeDatabase } from './db/index'
import { SettingsService } from './services/settings-service'
import { SecurityService } from './services/security-service'
import { registerDatabaseIPC } from './ipc/database'
import { registerSettingsIPC } from './ipc/settings'
import { registerSecurityIPC } from './ipc/security'

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Load the renderer
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// App lifecycle
app.whenReady().then(() => {
  // Initialize database with WAL mode
  const dbPath = join(app.getPath('userData'), 'content-creation.db')
  initDatabase(dbPath)

  // Initialize services
  const settingsService = new SettingsService()
  const securityService = new SecurityService()

  // Register IPC handlers
  registerDatabaseIPC()
  registerSettingsIPC(settingsService)
  registerSecurityIPC(securityService)

  // App info handler
  ipcMain.handle('app:info', async () => {
    return {
      version: app.getVersion(),
      userData: app.getPath('userData')
    }
  })

  // Rendering handler stub (will be implemented in Plan 03)
  ipcMain.handle('render:to-png', async (_event, _html, _dimensions) => {
    return ''
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Graceful shutdown - checkpoint WAL and close database
app.on('before-quit', () => {
  try {
    closeDatabase()
  } catch (err) {
    console.error('Error closing database:', err)
  }
})
