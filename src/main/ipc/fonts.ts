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
}
