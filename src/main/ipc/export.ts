import { ipcMain, dialog } from 'electron'
import { promises as fs } from 'fs'
import path from 'path'
import type { ExportFile } from '../../shared/types/generation'

// Track export state to prevent double-export
let isExporting = false

export function registerExportIPC() {
  // Select folder dialog
  ipcMain.handle('export:select-folder', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Export Folder',
      properties: ['openDirectory', 'createDirectory']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true }
    }

    return {
      canceled: false,
      path: result.filePaths[0]
    }
  })

  // Save files to selected folder
  ipcMain.handle('export:save-files', async (_event, args: { folderPath: string; files: ExportFile[] }) => {
    // Prevent race condition from double-clicks
    if (isExporting) {
      return {
        success: false,
        error: 'Export already in progress'
      }
    }

    isExporting = true

    try {
      const { folderPath, files } = args

      // Write all files concurrently
      await Promise.all(files.map(async (file) => {
        const filePath = path.join(folderPath, file.name)

        if (file.name.endsWith('.png')) {
          // Decode base64 data URL
          const base64Data = file.content.replace(/^data:image\/png;base64,/, '')
          const buffer = Buffer.from(base64Data, 'base64')
          await fs.writeFile(filePath, buffer)
        } else {
          // Write text file (caption)
          await fs.writeFile(filePath, file.content, 'utf-8')
        }
      }))

      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: (err as Error).message
      }
    } finally {
      isExporting = false
    }
  })
}
