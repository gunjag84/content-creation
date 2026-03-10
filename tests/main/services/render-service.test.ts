import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { NativeImage } from 'electron'
import { RenderService } from '@main/services/render-service'

// Track instances for testing
let lastBrowserWindowInstance: any = null

// Mock Electron modules
vi.mock('electron', () => {
  const createMockWebContents = () => ({
    once: vi.fn((event: string, callback: Function) => {
      // Immediately trigger did-finish-load for tests
      if (event === 'did-finish-load') {
        setTimeout(() => callback(), 0)
      }
    }),
    capturePage: vi.fn(() => {
      const mockImage: Partial<NativeImage> = {
        toPNG: vi.fn(() => Buffer.from('fake-png-data'))
      }
      return Promise.resolve(mockImage as NativeImage)
    }),
    loadURL: vi.fn(() => Promise.resolve()),
    setSize: vi.fn()
  })

  class BrowserWindowMock {
    webContents = createMockWebContents()
    setSize = vi.fn()
    loadURL = vi.fn(() => Promise.resolve())
    close = vi.fn()
    isDestroyed = vi.fn(() => false)

    constructor(public options?: any) {
      // Track the last instance created
      lastBrowserWindowInstance = this
    }

    static getAllWindows = vi.fn(() => [])
  }

  return {
    BrowserWindow: BrowserWindowMock,
    app: {
      getPath: vi.fn((name: string) => {
        if (name === 'temp') return '/tmp'
        if (name === 'userData') return '/tmp/user-data'
        return '/tmp'
      })
    }
  }
})

describe('RenderService', () => {
  let service: RenderService

  beforeEach(async () => {
    vi.clearAllMocks()
    lastBrowserWindowInstance = null
    service = new RenderService()
  })

  afterEach(async () => {
    await service.cleanup()
  })

  describe('initialize', () => {
    it('should create a hidden BrowserWindow with correct configuration', async () => {
      await service.initialize()

      expect(lastBrowserWindowInstance).toBeTruthy()
      expect(lastBrowserWindowInstance.options).toMatchObject({
        show: false,
        frame: false,
        width: 1080,
        height: 1920
      })
    })

    it('should wait for did-finish-load before resolving', async () => {
      await service.initialize()

      expect(lastBrowserWindowInstance.webContents.once).toHaveBeenCalledWith(
        'did-finish-load',
        expect.any(Function)
      )
    })

    it('should load blank HTML page', async () => {
      await service.initialize()

      expect(lastBrowserWindowInstance.loadURL).toHaveBeenCalledWith(
        expect.stringContaining('data:text/html')
      )
    })
  })

  describe('renderToPNG', () => {
    beforeEach(async () => {
      await service.initialize()
      vi.clearAllMocks() // Clear initialization calls
    })

    it('should throw error if not initialized', async () => {
      const uninitializedService = new RenderService()
      await expect(
        uninitializedService.renderToPNG('<div>test</div>', { width: 1080, height: 1350 })
      ).rejects.toThrow('RenderService not initialized')
    })

    it('should set window size to specified dimensions', async () => {
      await service.renderToPNG('<div>test</div>', { width: 1080, height: 1350 })

      expect(lastBrowserWindowInstance.setSize).toHaveBeenCalledWith(1080, 1350)
    })

    it('should load HTML via data URI', async () => {
      const html = '<div style="background:red">test</div>'
      await service.renderToPNG(html, { width: 1080, height: 1350 })

      expect(lastBrowserWindowInstance.loadURL).toHaveBeenCalledWith(
        expect.stringContaining('data:text/html')
      )
    })

    it('should wait for did-finish-load after loading HTML', async () => {
      await service.renderToPNG('<div>test</div>', { width: 1080, height: 1350 })

      // Called once for render (initialization calls were cleared)
      expect(lastBrowserWindowInstance.webContents.once).toHaveBeenCalled()
    })

    it('should call capturePage to capture the rendered image', async () => {
      await service.renderToPNG('<div>test</div>', { width: 1080, height: 1350 })

      expect(lastBrowserWindowInstance.webContents.capturePage).toHaveBeenCalled()
    })

    it('should return JSON with file path and data URL', async () => {
      const result = await service.renderToPNG('<div>test</div>', { width: 1080, height: 1350 })
      const parsed = JSON.parse(result)

      expect(parsed.filePath).toMatch(/[\\\/]tmp[\\\/]render_.*_1080x1350\.png/)
      expect(parsed.dataUrl).toMatch(/^data:image\/png;base64,/)
    })

    it('should handle sequential renders (carousel simulation)', async () => {
      const html1 = '<div>Slide 1</div>'
      const html2 = '<div>Slide 2</div>'
      const html3 = '<div>Slide 3</div>'

      const result1 = JSON.parse(await service.renderToPNG(html1, { width: 1080, height: 1350 }))
      const result2 = JSON.parse(await service.renderToPNG(html2, { width: 1080, height: 1350 }))
      const result3 = JSON.parse(await service.renderToPNG(html3, { width: 1080, height: 1350 }))

      expect(result1.filePath).toBeTruthy()
      expect(result2.filePath).toBeTruthy()
      expect(result3.filePath).toBeTruthy()
      expect(result1.filePath).not.toBe(result2.filePath)
      expect(result2.filePath).not.toBe(result3.filePath)
    })
  })

  describe('renderCarousel', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it('should render multiple slides sequentially', async () => {
      const slides = ['<div>Slide 1</div>', '<div>Slide 2</div>', '<div>Slide 3</div>']
      const results = await service.renderCarousel(slides, { width: 1080, height: 1350 })

      expect(results).toHaveLength(3)
      expect(JSON.parse(results[0]).filePath).toBeTruthy()
      expect(JSON.parse(results[1]).filePath).toBeTruthy()
      expect(JSON.parse(results[2]).filePath).toBeTruthy()
    })

    it('should return unique paths for each slide', async () => {
      const slides = ['<div>A</div>', '<div>B</div>']
      const results = await service.renderCarousel(slides, { width: 1080, height: 1350 })

      expect(JSON.parse(results[0]).filePath).not.toBe(JSON.parse(results[1]).filePath)
    })
  })

  describe('cleanup', () => {
    it('should close the render window', async () => {
      await service.initialize()

      await service.cleanup()

      expect(lastBrowserWindowInstance.close).toHaveBeenCalled()
    })

    it('should not throw if window is null', async () => {
      // Don't initialize, so window is null
      await expect(service.cleanup()).resolves.not.toThrow()
    })
  })
})
