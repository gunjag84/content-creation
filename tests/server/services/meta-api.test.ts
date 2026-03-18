import { describe, it, expect, vi, beforeEach } from 'vitest'
import { callGraphApi, tokenNeedsRefresh, refreshToken, ApiError } from '../../../src/server/services/meta-api'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => {
  mockFetch.mockReset()
})

describe('callGraphApi', () => {
  it('returns data on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: '123', username: 'test' })
    })
    const result = await callGraphApi('/me', 'token123')
    expect(result).toEqual({ id: '123', username: 'test' })
  })

  it('throws ApiError on 401', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Invalid token' } })
    })
    await expect(callGraphApi('/me', 'bad')).rejects.toThrow(ApiError)
    await expect(callGraphApi('/me', 'bad')).rejects.toThrow('Token expired or revoked')
  })

  it('throws ApiError on 429 with retryAfter', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      headers: { get: (h: string) => h === 'retry-after' ? '30' : null }
    })
    try {
      await callGraphApi('/me', 'token')
      expect.fail('should throw')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).retryAfter).toBe(30)
    }
  })

  it('throws on generic HTTP error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ error: { message: 'Server down' } })
    })
    await expect(callGraphApi('/me', 'token')).rejects.toThrow('Server down')
  })

  it('throws on timeout (abort)', async () => {
    mockFetch.mockImplementation(() => new Promise((_, reject) => {
      const err = new Error('aborted')
      err.name = 'AbortError'
      setTimeout(() => reject(err), 10)
    }))
    await expect(callGraphApi('/me', 'token')).rejects.toThrow('Instagram unavailable')
  })
})

describe('tokenNeedsRefresh', () => {
  it('returns true when token expires within 14 days', () => {
    const inTenDays = Math.floor(Date.now() / 1000) + 10 * 24 * 60 * 60
    expect(tokenNeedsRefresh(inTenDays)).toBe(true)
  })

  it('returns false when token expires in more than 14 days', () => {
    const inThirtyDays = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
    expect(tokenNeedsRefresh(inThirtyDays)).toBe(false)
  })
})

describe('refreshToken', () => {
  it('returns new token data on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'new_token', expires_in: 5184000 })
    })
    const result = await refreshToken('old_token')
    expect(result.access_token).toBe('new_token')
    expect(result.expires_in).toBe(5184000)
  })

  it('throws on failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: 'Invalid grant' } })
    })
    await expect(refreshToken('bad_token')).rejects.toThrow(ApiError)
  })
})
