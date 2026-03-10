import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SecurityService } from '@main/services/security-service'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('SecurityService', () => {
  let tempDir: string
  let service: SecurityService

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), 'security-test-' + Date.now())
    fs.mkdirSync(tempDir, { recursive: true })
    service = new SecurityService(tempDir)
  })

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('should save API key to encrypted file', async () => {
    await service.saveAPIKey('test-api-key-123')

    const keyPath = path.join(tempDir, '.api-key.enc')
    expect(fs.existsSync(keyPath)).toBe(true)
  })

  it('should load and decrypt API key', async () => {
    const testKey = 'test-api-key-456'
    await service.saveAPIKey(testKey)

    const loaded = await service.loadAPIKey()
    expect(loaded).toBe(testKey)
  })

  it('should return null when no key file exists', async () => {
    const loaded = await service.loadAPIKey()
    expect(loaded).toBeNull()
  })

  it('should delete API key file', async () => {
    await service.saveAPIKey('test-key')
    await service.deleteAPIKey()

    const keyPath = path.join(tempDir, '.api-key.enc')
    expect(fs.existsSync(keyPath)).toBe(false)
  })

  it('should handle delete when file does not exist', async () => {
    await expect(service.deleteAPIKey()).resolves.not.toThrow()
  })

  it('should report availability when encryption is available', () => {
    expect(service.isAvailable()).toBe(true)
  })

  it('should encrypt and decrypt correctly', async () => {
    const originalKey = 'my-secret-api-key-with-special-chars-!@#$%'
    await service.saveAPIKey(originalKey)
    const decrypted = await service.loadAPIKey()

    expect(decrypted).toBe(originalKey)
  })
})
