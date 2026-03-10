import { ipcMain } from 'electron'
import type { RenderService } from '../services/render-service'

export function registerRenderingIPC(renderService: RenderService) {
  // Render HTML to PNG
  ipcMain.handle(
    'render:to-png',
    async (_event, html: string, dimensions: { width: number; height: number }) => {
      return renderService.renderToPNG(html, dimensions)
    }
  )
}
