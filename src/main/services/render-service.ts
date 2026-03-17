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
            contextIsolation: true,
          }
        })

        // Initialize with a file:// URL so subsequent loadFile calls stay same-origin.
        // Using data: as origin causes Chromium 130+ to block file:// navigation (ERR_ABORTED).
        const tempDir = app.getPath('temp')
        const initPath = path.join(tempDir, 'render_init.html')
        fs.writeFileSync(initPath, '<!DOCTYPE html><html><body></body></html>', 'utf-8')

        // Wait for initial load to complete
        this.renderWindow.webContents.once('did-finish-load', () => {
          resolve()
        })

        this.renderWindow.loadFile(initPath)
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
      const onLoad = () => {
        this.renderWindow!.webContents.removeListener('did-fail-load', onFail)
        resolve()
      }
      const onFail = (_event: any, errorCode: number, errorDescription: string) => {
        this.renderWindow!.webContents.removeListener('did-finish-load', onLoad)
        reject(new Error(`Page load failed: ${errorDescription} (${errorCode})`))
      }
      this.renderWindow!.webContents.once('did-finish-load', onLoad)
      this.renderWindow!.webContents.once('did-fail-load', onFail)
      this.renderWindow!.loadFile(htmlFilePath).catch(reject)
    })

    // Wait for all images (including CSS background-image) to load
    await this.renderWindow!.webContents.executeJavaScript(`
      new Promise((resolve) => {
        // Collect all image sources: <img> tags and CSS background-image
        const imgElements = Array.from(document.querySelectorAll('img'));
        const bgElements = Array.from(document.querySelectorAll('*')).filter(el => {
          const bg = getComputedStyle(el).backgroundImage;
          return bg && bg !== 'none';
        });

        const promises = [];

        // Wait for <img> elements
        imgElements.forEach(img => {
          if (!img.complete) {
            promises.push(new Promise(r => {
              img.onload = r;
              img.onerror = r;
            }));
          }
        });

        // Wait for CSS background images by preloading them
        bgElements.forEach(el => {
          const bg = getComputedStyle(el).backgroundImage;
          const match = bg.match(/url\\(["']?(.+?)["']?\\)/);
          if (match && match[1]) {
            const testImg = new Image();
            promises.push(new Promise(r => {
              testImg.onload = r;
              testImg.onerror = r;
              testImg.src = match[1];
            }));
          }
        });

        if (promises.length === 0) {
          // No images to wait for, but give CSS a frame to paint
          requestAnimationFrame(() => requestAnimationFrame(() => resolve(undefined)));
        } else {
          Promise.all(promises).then(() => {
            // Extra frame for paint after images load
            requestAnimationFrame(() => requestAnimationFrame(() => resolve(undefined)));
          });
        }

        // Safety timeout: never wait more than 5 seconds
        setTimeout(resolve, 5000);
      })
    `)

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
