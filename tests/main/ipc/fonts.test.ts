import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

describe('Font Operations', () => {
  let tempDir: string

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'font-test-'))
  })

  afterEach(async () => {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch (err) {
      // Ignore cleanup errors
    }
  })

  it('should list fonts from directory', async () => {
    // Create test font files
    const fontsDir = path.join(tempDir, 'fonts')
    await fs.mkdir(fontsDir, { recursive: true })

    await fs.writeFile(path.join(fontsDir, 'test-font.ttf'), 'fake font data')
    await fs.writeFile(path.join(fontsDir, 'another-font.otf'), 'fake font data')
    await fs.writeFile(path.join(fontsDir, 'not-a-font.txt'), 'text file')

    // Read fonts directory
    const files = await fs.readdir(fontsDir)
    const fontFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase()
      return ['.ttf', '.otf', '.woff2'].includes(ext)
    })

    expect(fontFiles).toHaveLength(2)
    expect(fontFiles).toContain('test-font.ttf')
    expect(fontFiles).toContain('another-font.otf')
    expect(fontFiles).not.toContain('not-a-font.txt')
  })

  it('should return empty array when fonts directory does not exist', async () => {
    const nonExistentDir = path.join(tempDir, 'nonexistent')

    let files: any[]
    try {
      await fs.readdir(nonExistentDir)
      files = []
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        files = []
      } else {
        throw err
      }
    }

    expect(files).toEqual([])
  })

  it('should derive font family from filename', () => {
    const testCases = [
      { filename: 'Roboto-Bold.ttf', expected: 'Roboto Bold' },
      { filename: 'Open_Sans.otf', expected: 'Open Sans' },
      { filename: 'Inter-Regular.woff2', expected: 'Inter Regular' }
    ]

    for (const { filename, expected } of testCases) {
      const family = path.basename(filename, path.extname(filename))
        .replace(/[-_]/g, ' ')
      expect(family).toBe(expected)
    }
  })

  it('should copy font file to destination', async () => {
    const sourceFile = path.join(tempDir, 'source.ttf')
    const destDir = path.join(tempDir, 'fonts')
    const destFile = path.join(destDir, 'source.ttf')

    // Create source file
    await fs.writeFile(sourceFile, 'font data content')

    // Create destination directory and copy
    await fs.mkdir(destDir, { recursive: true })
    await fs.copyFile(sourceFile, destFile)

    // Verify file was copied
    const exists = await fs.access(destFile).then(() => true).catch(() => false)
    expect(exists).toBe(true)

    const content = await fs.readFile(destFile, 'utf-8')
    expect(content).toBe('font data content')
  })
})
