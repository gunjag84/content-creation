import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { initDatabase, closeDatabase } from './db/index'
import { SettingsService } from './services/settings-service'
import { SecurityService } from './services/security-service'
import { RenderService } from './services/render-service'
import { registerDatabaseIPC } from './ipc/database'
import { registerSettingsIPC } from './ipc/settings'
import { registerSecurityIPC } from './ipc/security'
import { registerRenderingIPC } from './ipc/rendering'
import { registerTemplateIPC } from './ipc/templates'
import { registerFontIPC } from './ipc/fonts'
import { registerGenerationIPC } from './ipc/generation'
import { registerExportIPC } from './ipc/export'
import { registerPresetsHandlers } from './ipc/presets'
import './ipc/posts'  // Post CRUD and balance IPC handlers

// Global reference to render service for lifecycle management
let renderService: RenderService

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  // Load the renderer
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// App lifecycle
app.whenReady().then(async () => {
  // Initialize database with WAL mode
  const dbPath = join(app.getPath('userData'), 'content-creation.db')
  try {
    initDatabase(dbPath)
  } catch (err) {
    console.error('Database init failed:', err)
  }

  // Initialize services
  const settingsService = new SettingsService()
  const securityService = new SecurityService()

  // Register IPC handlers (before window so they're ready when renderer loads)
  registerDatabaseIPC()
  registerSettingsIPC(settingsService)
  registerSecurityIPC(securityService)
  registerTemplateIPC()
  registerFontIPC()
  registerGenerationIPC()
  registerExportIPC()
  registerPresetsHandlers()

  // App info handler
  ipcMain.handle('app:info', async () => {
    return {
      version: app.getVersion(),
      userData: app.getPath('userData')
    }
  })

  // Create main window first so it appears immediately
  createWindow()

  // Initialize render service AFTER main window is visible
  renderService = new RenderService()
  try {
    await renderService.initialize()
  } catch (err) {
    console.error('RenderService init failed:', err)
  }
  registerRenderingIPC(renderService)

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

// Graceful shutdown - cleanup render service and close database
app.on('before-quit', async () => {
  try {
    if (renderService) {
      await renderService.cleanup()
    }
    closeDatabase()
  } catch (err) {
    console.error('Error during shutdown:', err)
  }
})
