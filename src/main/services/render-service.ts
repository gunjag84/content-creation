import { BrowserWindow, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

export class RenderService {
  private renderWindow: BrowserWindow | null = null

  /**
   * Initialize the persistent hidden BrowserWindow for rendering.
   * CRITICAL: Uses show: false (NOT hide()) to prevent window flashing.
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.renderWindow = new BrowserWindow({
          show: false, // CRITICAL - NOT hide(), per research pitfall #2
          frame: false,
          width: 1080,
          height: 1920, // Max needed dimension (story size)
          webPreferences: {
            offscreen: false,
            nodeIntegration: false,
            contextIsolation: true
          }
        })

        // Load blank HTML page
        const blankHTML = 'data:text/html,<html><body></body></html>'

        // Wait for initial load to complete
        this.renderWindow.webContents.once('did-finish-load', () => {
          resolve()
        })

        this.renderWindow.loadURL(blankHTML)
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Render HTML/CSS to PNG at specified dimensions.
   * Uses persistent hidden window for sequential rendering.
   */
  async renderToPNG(
    html: string,
    dimensions: { width: number; height: number }
  ): Promise<string> {
    if (!this.renderWindow) {
      throw new Error('RenderService not initialized. Call initialize() first.')
    }

    // Set window size to target dimensions
    this.renderWindow.setSize(dimensions.width, dimensions.height)

    const tempDir = app.getPath('temp')

    // Write HTML to temp file to avoid data: URI length limits (~2MB cap in Chromium)
    const timestamp = Date.now()
    const htmlFilename = `render_${timestamp}.html`
    const htmlFilePath = path.join(tempDir, htmlFilename)
    fs.writeFileSync(htmlFilePath, html, 'utf-8')

    // Load HTML and wait for completion
    await new Promise<void>((resolve, reject) => {
      this.renderWindow!.webContents.once('did-finish-load', () => {
        resolve()
      })

      this.renderWindow!.loadFile(htmlFilePath).catch(reject)
    })

    // Add 300ms delay for CSS rendering and fonts from file:// references
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Capture the page as PNG
    const image = await this.renderWindow.webContents.capturePage()

    // Cleanup temp HTML file
    try {
      fs.unlinkSync(htmlFilePath)
    } catch (_) {
      /* ignore */
    }

    // Save to temp directory
    const filename = `render_${timestamp}_${dimensions.width}x${dimensions.height}.png`
    const filePath = path.join(tempDir, filename)

    // Write PNG buffer to file
    const pngBuffer = image.toPNG()
    fs.writeFileSync(filePath, pngBuffer)

    // Return both path and base64 for display in renderer
    const base64 = pngBuffer.toString('base64')
    return JSON.stringify({ filePath, dataUrl: `data:image/png;base64,${base64}` })
  }

  /**
   * Render multiple HTML slides sequentially (for carousel posts).
   * Uses the same persistent window for all renders.
   */
  async renderCarousel(
    slides: string[],
    dimensions: { width: number; height: number }
  ): Promise<string[]> {
    const paths: string[] = []

    for (const slide of slides) {
      const filePath = await this.renderToPNG(slide, dimensions)
      paths.push(filePath)
    }

    return paths
  }

  /**
   * Cleanup: close the render window.
   */
  async cleanup(): Promise<void> {
    if (this.renderWindow && !this.renderWindow.isDestroyed()) {
      this.renderWindow.close()
    }
    this.renderWindow = null
  }
}
