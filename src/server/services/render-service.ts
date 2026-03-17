import { chromium, type Browser, type Page } from 'playwright'

const RENDER_TIMEOUT = 30_000

export class RenderService {
  private browser: Browser | null = null

  async init(): Promise<void> {
    this.browser = await chromium.launch({ headless: true })
  }

  private async ensureBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await chromium.launch({ headless: true })
    }
    return this.browser
  }

  async renderSlide(html: string, width = 1080, height = 1350): Promise<Buffer> {
    const browser = await this.ensureBrowser()
    let page: Page | null = null

    try {
      page = await browser.newPage({ viewport: { width, height } })

      await page.setContent(html, {
        waitUntil: 'networkidle',
        timeout: RENDER_TIMEOUT
      })

      // Wait for fonts to load in the page context
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      await page.waitForFunction('document.fonts.ready')

      const buffer = await page.screenshot({ type: 'png', fullPage: false })
      return buffer
    } catch (err) {
      // On failure, try to restart browser for next call
      if (this.browser && !this.browser.isConnected()) {
        this.browser = null
      }
      throw err
    } finally {
      if (page) await page.close().catch(() => {})
    }
  }

  async renderCarousel(slides: string[], width = 1080, height = 1350): Promise<Buffer[]> {
    const results: Buffer[] = []
    for (const html of slides) {
      results.push(await this.renderSlide(html, width, height))
    }
    return results
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close().catch(() => {})
      this.browser = null
    }
  }
}
