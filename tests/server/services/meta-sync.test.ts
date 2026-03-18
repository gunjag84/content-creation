import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies before importing
const mockCallGraphApi = vi.fn()
const mockTokenNeedsRefresh = vi.fn(() => false)
const mockRefreshToken = vi.fn()
const mockGetMetaToken = vi.fn()
const mockSaveMetaToken = vi.fn()
const mockUpsertPerformance = vi.fn()
const mockUpsertIgPost = vi.fn()
const mockGetPerformance = vi.fn(() => null)
const mockListPosts = vi.fn(() => [])

vi.mock('../../../src/server/services/meta-api', () => ({
  callGraphApi: (...args: any[]) => mockCallGraphApi(...args),
  tokenNeedsRefresh: (...args: any[]) => mockTokenNeedsRefresh(...args),
  refreshToken: (...args: any[]) => mockRefreshToken(...args),
  ApiError: class ApiError extends Error {
    status: number
    constructor(msg: string, status: number) {
      super(msg)
      this.name = 'ApiError'
      this.status = status
    }
  }
}))

vi.mock('../../../src/server/db/queries', () => ({
  getMetaToken: (...args: any[]) => mockGetMetaToken(...args),
  saveMetaToken: (...args: any[]) => mockSaveMetaToken(...args),
  upsertPerformance: (...args: any[]) => mockUpsertPerformance(...args),
  upsertIgPost: (...args: any[]) => mockUpsertIgPost(...args),
  getPerformance: (...args: any[]) => mockGetPerformance(...args),
  listPosts: (...args: any[]) => mockListPosts(...args)
}))

vi.mock('../../../src/shared/performanceScore', () => ({
  computePerformanceScore: () => 0
}))

import { syncIgStats } from '../../../src/server/services/meta-sync'

beforeEach(() => {
  mockCallGraphApi.mockReset()
  mockTokenNeedsRefresh.mockReset().mockReturnValue(false)
  mockRefreshToken.mockReset()
  mockGetMetaToken.mockReset()
  mockSaveMetaToken.mockReset()
  mockUpsertPerformance.mockReset()
  mockUpsertIgPost.mockReset()
  mockGetPerformance.mockReset().mockReturnValue(null)
  mockListPosts.mockReset().mockReturnValue([])
})

const fakeToken = {
  id: 1,
  access_token: 'test_token',
  ig_user_id: '123',
  ig_username: 'testuser',
  expires_at: Math.floor(Date.now() / 1000) + 60 * 24 * 60 * 60,
  created_at: Math.floor(Date.now() / 1000)
}

describe('syncIgStats', () => {
  it('throws when no token configured', async () => {
    mockGetMetaToken.mockReturnValue(undefined)
    await expect(syncIgStats()).rejects.toThrow('No Instagram token configured')
  })

  it('syncs posts that match by caption', async () => {
    // Captions must share first 50 chars for prefix matching
    const sharedPrefix = 'Hello world this is a test caption for matching now'  // 51 chars
    mockGetMetaToken.mockReturnValue({ ...fakeToken })
    mockListPosts.mockReturnValue([
      { id: 1, caption: sharedPrefix + ' local extra text here', status: 'approved' }
    ])

    mockCallGraphApi
      .mockResolvedValueOnce({
        data: [{
          id: 'ig_1',
          caption: sharedPrefix + ' on Instagram with hashtags',
          timestamp: '2026-03-01T00:00:00Z',
          media_type: 'IMAGE'
        }],
        paging: {}
      })
      .mockResolvedValueOnce({
        data: [
          { name: 'reach', values: [{ value: 500 }] },
          { name: 'likes', values: [{ value: 25 }] }
        ]
      })
      .mockResolvedValueOnce({ data: [] }) // ads API - no ads

    const result = await syncIgStats()
    expect(result.synced).toBe(1)
    expect(result.errors).toBe(0)
    expect(result.unlinked).toHaveLength(0)
    expect(mockUpsertPerformance).toHaveBeenCalledOnce()
  })

  it('marks posts as unlinked when no caption match', async () => {
    mockGetMetaToken.mockReturnValue({ ...fakeToken })
    mockListPosts.mockReturnValue([])

    mockCallGraphApi
      .mockResolvedValueOnce({
        data: [{ id: 'ig_no_match', caption: 'Completely different', timestamp: '2026-03-01T00:00:00Z', media_type: 'IMAGE' }],
        paging: {}
      })
      .mockResolvedValueOnce({ data: [] }) // ads API - no ads

    const result = await syncIgStats()
    expect(result.synced).toBe(1) // synced = insights fetched (even if unlinked)
    expect(result.unlinked).toHaveLength(1)
  })

  it('handles null caption IG posts (marks as unlinked)', async () => {
    mockGetMetaToken.mockReturnValue({ ...fakeToken })
    mockListPosts.mockReturnValue([{ id: 1, caption: 'Some post', status: 'approved' }])

    mockCallGraphApi
      .mockResolvedValueOnce({
        data: [{ id: 'ig_null', caption: undefined, timestamp: '2026-03-01T00:00:00Z', media_type: 'IMAGE' }],
        paging: {}
      })
      .mockResolvedValueOnce({ data: [] }) // ads API - no ads

    const result = await syncIgStats()
    expect(result.unlinked).toHaveLength(1)
  })

  it('handles per-post errors without stopping sync', async () => {
    // Captions must share first 50 chars for matching to work
    const sharedPrefix1 = 'Match one caption for testing here today lets go ya'  // 51 chars
    const sharedPrefix2 = 'Match two caption for testing here today lets go ya'  // 51 chars
    mockGetMetaToken.mockReturnValue({ ...fakeToken })
    mockListPosts.mockReturnValue([
      { id: 1, caption: sharedPrefix1 + ' local extra', status: 'approved' },
      { id: 2, caption: sharedPrefix2 + ' local extra', status: 'approved' }
    ])

    mockCallGraphApi
      .mockResolvedValueOnce({
        data: [
          { id: 'ig_1', caption: sharedPrefix1 + ' IG extra text', timestamp: '2026-03-01T00:00:00Z', media_type: 'IMAGE' },
          { id: 'ig_2', caption: sharedPrefix2 + ' IG extra text', timestamp: '2026-03-01T00:00:00Z', media_type: 'IMAGE' }
        ],
        paging: {}
      })
      .mockResolvedValueOnce({ data: [{ name: 'reach', values: [{ value: 100 }] }] })
      .mockRejectedValueOnce(new Error('Deleted post'))
      .mockResolvedValueOnce({ data: [] }) // ads API - no ads

    const result = await syncIgStats()
    expect(result.synced).toBe(1)
    expect(result.errors).toBe(1)
  })

  it('excludes draft posts from match candidates', async () => {
    const sharedCaption = 'Draft post caption text for matching test extra pad'  // 51 chars
    mockGetMetaToken.mockReturnValue({ ...fakeToken })
    mockListPosts.mockReturnValue([
      { id: 1, caption: sharedCaption + ' local', status: 'draft' }
    ])

    mockCallGraphApi
      .mockResolvedValueOnce({
        data: [{ id: 'ig_1', caption: sharedCaption + ' ig side', timestamp: '2026-03-01T00:00:00Z', media_type: 'IMAGE' }],
        paging: {}
      })
      .mockResolvedValueOnce({ data: [] }) // ads API - no ads

    const result = await syncIgStats()
    expect(result.unlinked).toHaveLength(1)
    expect(result.synced).toBe(1) // synced = insights fetched (draft excluded from matching, stored as standalone)
  })

  it('handles short caption matching (< 25 chars)', async () => {
    mockGetMetaToken.mockReturnValue({ ...fakeToken })
    mockListPosts.mockReturnValue([
      { id: 1, caption: 'Short cap', status: 'approved' }
    ])

    mockCallGraphApi
      .mockResolvedValueOnce({
        data: [{ id: 'ig_short', caption: 'Short cap', timestamp: '2026-03-01T00:00:00Z', media_type: 'IMAGE' }],
        paging: {}
      })
      .mockResolvedValueOnce({ data: [{ name: 'reach', values: [{ value: 50 }] }] })
      .mockResolvedValueOnce({ data: [] }) // ads API - no ads

    const result = await syncIgStats()
    expect(result.synced).toBe(1)
  })

  it('first match wins on duplicate caption prefix', async () => {
    const sharedCaption = 'Duplicate prefix text for testing the match logic h'  // 51 chars
    mockGetMetaToken.mockReturnValue({ ...fakeToken })
    mockListPosts.mockReturnValue([
      { id: 1, caption: sharedCaption + 'ere local one', status: 'approved' },
      { id: 2, caption: sharedCaption + 'ere local two', status: 'approved' }
    ])

    mockCallGraphApi
      .mockResolvedValueOnce({
        data: [{ id: 'ig_dup', caption: sharedCaption + 'ere on IG side', timestamp: '2026-03-01T00:00:00Z', media_type: 'IMAGE' }],
        paging: {}
      })
      .mockResolvedValueOnce({ data: [{ name: 'reach', values: [{ value: 100 }] }] })
      .mockResolvedValueOnce({ data: [] }) // ads API - no ads

    const result = await syncIgStats()
    expect(result.synced).toBe(1)
    expect(mockUpsertPerformance).toHaveBeenCalledWith(1, expect.anything())
  })

  it('handles token refresh when needed', async () => {
    mockGetMetaToken.mockReturnValue({ ...fakeToken })
    mockTokenNeedsRefresh.mockReturnValue(true)
    mockRefreshToken.mockResolvedValue({ access_token: 'refreshed', expires_in: 5184000 })
    mockListPosts.mockReturnValue([])

    mockCallGraphApi
      .mockResolvedValueOnce({ data: [], paging: {} })
      .mockResolvedValueOnce({ data: [] }) // ads API - no ads

    const result = await syncIgStats()
    expect(result.synced).toBe(0)
  })
})
