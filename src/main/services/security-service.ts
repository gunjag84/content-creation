import fs from 'fs/promises'
import path from 'path'
import { app, safeStorage } from 'electron'

export class SecurityService {
  private basePath: string
  private keyPath: string

  constructor(basePath?: string) {
    this.basePath = basePath || app.getPath('userData')
    this.keyPath = path.join(this.basePath, '.api-key.enc')
  }

  async saveAPIKey(plainText: string): Promise<void> {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Encryption is not available on this platform')
    }

    const encrypted = safeStorage.encryptString(plainText)
    await fs.writeFile(this.keyPath, encrypted)
  }

  async loadAPIKey(): Promise<string | null> {
    try {
      const encrypted = await fs.readFile(this.keyPath)

      if (!safeStorage.isEncryptionAvailable()) {
        throw new Error('Encryption is not available on this platform')
      }

      const decrypted = safeStorage.decryptString(encrypted)
      return decrypted
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return null
      }
      throw err
    }
  }

  async deleteAPIKey(): Promise<void> {
    try {
      await fs.unlink(this.keyPath)
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        // File doesn't exist, ignore
        return
      }
      throw err
    }
  }

  isAvailable(): boolean {
    return safeStorage.isEncryptionAvailable()
  }
}
