import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'

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

// IPC Handlers - Stubs that will be replaced in Plans 02 and 03

// App info handler (implemented)
ipcMain.handle('app:info', async () => {
  return {
    version: app.getVersion(),
    userData: app.getPath('userData')
  }
})

// Settings handlers (stubs)
ipcMain.handle('settings:load', async () => {
  return {}
})

ipcMain.handle('settings:save', async (_event, _settings) => {
  // Stub implementation
})

// Database handlers (stubs)
ipcMain.handle('db:status', async () => {
  return { ok: false, tables: 0 }
})

// Rendering handlers (stubs)
ipcMain.handle('render:to-png', async (_event, _html, _dimensions) => {
  return ''
})

// Security handlers (stubs)
ipcMain.handle('security:save-key', async (_event, _key) => {
  // Stub implementation
})

ipcMain.handle('security:load-key', async () => {
  return null
})

ipcMain.handle('security:delete-key', async () => {
  // Stub implementation
})
