import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

describe('Export Operations', () => {
  let tempDir: string

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'export-test-'))
  })

  afterEach(async () => {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch (err) {
      // Ignore cleanup errors
    }
  })

  it('should write PNG file from base64 data URL', async () => {
    // Small 1x1 red PNG as base64
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='
    const dataUrl = `data:image/png;base64,${base64}`
    const filePath = path.join(tempDir, 'test-slide.png')

    // Strip data URL prefix and decode base64
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    await fs.writeFile(filePath, buffer)

    // Verify file was written
    const exists = await fs.access(filePath).then(() => true).catch(() => false)
    expect(exists).toBe(true)

    // Verify file content
    const readBuffer = await fs.readFile(filePath)
    expect(readBuffer.equals(buffer)).toBe(true)
  })

  it('should write text file with UTF-8 content', async () => {
    const content = 'This is a caption with emoji 🎉 and special chars: äöü'
    const filePath = path.join(tempDir, 'caption.txt')

    await fs.writeFile(filePath, content, 'utf-8')

    // Verify file was written
    const exists = await fs.access(filePath).then(() => true).catch(() => false)
    expect(exists).toBe(true)

    // Verify file content
    const readContent = await fs.readFile(filePath, 'utf-8')
    expect(readContent).toBe(content)
  })

  it('should write multiple files concurrently', async () => {
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='
    const files = [
      { name: 'slide-01.png', content: `data:image/png;base64,${base64}` },
      { name: 'slide-02.png', content: `data:image/png;base64,${base64}` },
      { name: 'caption.txt', content: 'Test caption' }
    ]

    // Write all files concurrently
    await Promise.all(files.map(async file => {
      const filePath = path.join(tempDir, file.name)
      if (file.name.endsWith('.png')) {
        const base64Data = file.content.replace(/^data:image\/png;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')
        await fs.writeFile(filePath, buffer)
      } else {
        await fs.writeFile(filePath, file.content, 'utf-8')
      }
    }))

    // Verify all files were written
    const writtenFiles = await fs.readdir(tempDir)
    expect(writtenFiles).toHaveLength(3)
    expect(writtenFiles).toContain('slide-01.png')
    expect(writtenFiles).toContain('slide-02.png')
    expect(writtenFiles).toContain('caption.txt')
  })

  it('should return success true after all files written', async () => {
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='
    const files = [
      { name: 'slide-01.png', content: `data:image/png;base64,${base64}` },
      { name: 'caption.txt', content: 'Test caption' }
    ]

    // Simulate export handler logic
    let success = false
    let error: string | undefined
    try {
      await Promise.all(files.map(async file => {
        const filePath = path.join(tempDir, file.name)
        if (file.name.endsWith('.png')) {
          const base64Data = file.content.replace(/^data:image\/png;base64,/, '')
          const buffer = Buffer.from(base64Data, 'base64')
          await fs.writeFile(filePath, buffer)
        } else {
          await fs.writeFile(filePath, file.content, 'utf-8')
        }
      }))
      success = true
    } catch (err) {
      error = (err as Error).message
    }

    expect(success).toBe(true)
    expect(error).toBeUndefined()

    // Verify files exist
    const writtenFiles = await fs.readdir(tempDir)
    expect(writtenFiles).toHaveLength(2)
  })
})
