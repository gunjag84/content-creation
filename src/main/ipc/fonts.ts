import { ipcMain, dialog, app } from 'electron'
import { promises as fs } from 'fs'
import path from 'path'

export function registerFontIPC() {
  ipcMain.handle('fonts:upload', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Upload Font',
      filters: [
        { name: 'Fonts', extensions: ['ttf', 'otf', 'woff2'] }
      ],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const sourcePath = result.filePaths[0]
    const filename = path.basename(sourcePath)

    // Create fonts directory in userData if it doesn't exist
    const fontsDir = path.join(app.getPath('userData'), 'fonts')
    await fs.mkdir(fontsDir, { recursive: true })

    // Copy font file
    const destPath = path.join(fontsDir, filename)
    await fs.copyFile(sourcePath, destPath)

    // Derive font family from filename
    const family = path.basename(filename, path.extname(filename))
      .replace(/[-_]/g, ' ')

    return {
      filename,
      path: destPath,
      family
    }
  })

  ipcMain.handle('fonts:list', async () => {
    const fontsDir = path.join(app.getPath('userData'), 'fonts')

    try {
      const files = await fs.readdir(fontsDir)
      const fontFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase()
        return ['.ttf', '.otf', '.woff2'].includes(ext)
      })

      return fontFiles.map(filename => ({
        filename,
        path: path.join(fontsDir, filename)
      }))
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return []
      }
      throw err
    }
  })

  ipcMain.handle('logo:upload', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Upload Logo',
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'svg'] }
      ],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const sourcePath = result.filePaths[0]
    const filename = path.basename(sourcePath)

    // Create logo directory in userData if it doesn't exist
    const logoDir = path.join(app.getPath('userData'), 'logo')
    await fs.mkdir(logoDir, { recursive: true })

    // Copy logo file
    const destPath = path.join(logoDir, filename)
    await fs.copyFile(sourcePath, destPath)

    return {
      filename,
      path: destPath
    }
  })

  ipcMain.handle('templates:upload-background', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Upload Template Background',
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }
      ],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const sourcePath = result.filePaths[0]
    const filename = path.basename(sourcePath)

    // Create template images directory in userData if it doesn't exist
    const templatesDir = path.join(app.getPath('userData'), 'templates', 'images')
    await fs.mkdir(templatesDir, { recursive: true })

    // Copy image file
    const destPath = path.join(templatesDir, filename)
    await fs.copyFile(sourcePath, destPath)

    return destPath
  })

  // Read file as base64 data URL for renderer display
  ipcMain.handle('file:read-as-data-url', async (_event, filePath: string) => {
    const allowedExtensions = ['.ttf', '.otf', '.woff', '.woff2', '.png', '.jpg', '.jpeg', '.svg', '.webp']
    const ext = path.extname(filePath).toLowerCase()
    const userDataDir = app.getPath('userData')
    const resolved = path.resolve(filePath)
    if (!allowedExtensions.includes(ext) && !resolved.startsWith(userDataDir)) {
      throw new Error(`Access denied: file type not allowed and path outside userData`)
    }
    const data = await fs.readFile(filePath)
    const ext = path.extname(filePath).toLowerCase().replace('.', '')
    const mimeType = ext === 'jpg' ? 'image/jpeg' : ext === 'png' ? 'image/png' : `image/${ext}`
    return `data:${mimeType};base64,${data.toString('base64')}`
  })
}
