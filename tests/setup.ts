import { vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'

// Mock electron module
vi.mock('electron', () => ({
  app: {
    getPath: (name: string) => {
      if (name === 'userData') {
        return path.join(os.tmpdir(), 'content-creation-test-' + Date.now())
      }
      return os.tmpdir()
    }
  },
  safeStorage: {
    isEncryptionAvailable: () => true,
    encryptString: (text: string) => Buffer.from(text, 'utf-8'),
    decryptString: (buffer: Buffer) => buffer.toString('utf-8')
  },
  ipcMain: {
    handle: vi.fn()
  }
}))

// Helper to create temporary test database
export function createTempDbPath(): string {
  const tempDir = path.join(os.tmpdir(), 'content-creation-test-' + Date.now())
  fs.mkdirSync(tempDir, { recursive: true })
  return path.join(tempDir, 'test.db')
}

// Helper to clean up temp directory
export function cleanupTempDir(dbPath: string) {
  const dir = path.dirname(dbPath)
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

// Global cleanup
afterEach(() => {
  // Reset all mocks after each test
  vi.clearAllMocks()
})
