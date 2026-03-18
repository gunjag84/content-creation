import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'

// Mock dependencies
vi.mock('../../../src/server/services/meta-api', () => ({
  callGraphApi: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number
    constructor(msg: string, status: number) {
      super(msg)
      this.name = 'ApiError'
      this.status = status
    }
  }
}))

vi.mock('../../../src/server/services/meta-sync', () => ({
  syncIgStats: vi.fn(),
  isSyncOnCooldown: vi.fn(() => false),
  getLastSyncAt: vi.fn(() => 0)
}))

vi.mock('../../../src/server/db/queries', () => ({
  getMetaToken: vi.fn(),
  saveMetaToken: vi.fn(),
  deleteMetaToken: vi.fn(),
  linkIgPost: vi.fn()
}))

import instagramRoutes from '../../../src/server/routes/instagram'
import { callGraphApi } from '../../../src/server/services/meta-api'
import { syncIgStats, isSyncOnCooldown } from '../../../src/server/services/meta-sync'
import { linkIgPost } from '../../../src/server/db/queries'

const app = express()
app.use(express.json())
app.use('/api/instagram', instagramRoutes)

beforeEach(() => { vi.clearAllMocks() })

describe('POST /api/instagram/connect', () => {
  it('connects with valid token', async () => {
    vi.mocked(callGraphApi).mockResolvedValue({ id: '123', username: 'testuser' })

    const res = await request(app)
      .post('/api/instagram/connect')
      .send({ access_token: 'valid_token' })

    expect(res.status).toBe(200)
    expect(res.body.connected).toBe(true)
    expect(res.body.username).toBe('testuser')
  })

  it('rejects missing token', async () => {
    const res = await request(app)
      .post('/api/instagram/connect')
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('access_token')
  })

  it('handles invalid token (no IG account)', async () => {
    vi.mocked(callGraphApi).mockResolvedValue({ id: '', username: '' })

    const res = await request(app)
      .post('/api/instagram/connect')
      .send({ access_token: 'invalid' })

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('No Instagram business account')
  })
})

describe('POST /api/instagram/sync', () => {
  it('rejects when on cooldown', async () => {
    vi.mocked(isSyncOnCooldown).mockReturnValue(true)

    const res = await request(app)
      .post('/api/instagram/sync')

    expect(res.status).toBe(429)
  })
})

describe('POST /api/instagram/link', () => {
  it('links an IG post to a local post', async () => {
    const res = await request(app)
      .post('/api/instagram/link')
      .send({ ig_media_id: 'ig_123', post_id: 1 })

    expect(res.status).toBe(200)
    expect(res.body.linked).toBe(true)
    expect(vi.mocked(linkIgPost)).toHaveBeenCalledWith('ig_123', 1)
  })
})
