/**
 * Instagram sync orchestrator.
 * Fetches IG posts + insights, matches to local posts by caption prefix.
 */

import {
  callGraphApi,
  tokenNeedsRefresh,
  refreshToken,
  ApiError,
  type IgMediaPage,
  type IgInsightsResponse,
  type IgMedia
} from './meta-api'
import {
  getMetaToken,
  saveMetaToken,
  upsertPerformance,
  listPosts
} from '../db/queries'
import { computePerformanceScore } from '../../shared/performanceScore'

// In-memory cooldown (resets on server restart - acceptable per E5)
let lastSyncAt = 0
const SYNC_COOLDOWN_MS = 15 * 60 * 1000 // 15 minutes

export interface SyncResult {
  synced: number
  errors: number
  unlinked: IgUnlinkedPost[]
}

export interface IgUnlinkedPost {
  ig_media_id: string
  caption: string | null
  timestamp: string
  permalink?: string
}

/**
 * Run full Instagram sync.
 */
export async function syncIgStats(): Promise<SyncResult> {
  const token = getMetaToken()
  if (!token) {
    throw new ApiError('No Instagram token configured', 401)
  }

  // Refresh token if needed (silent, per D9)
  if (tokenNeedsRefresh(token.expires_at)) {
    try {
      const refreshed = await refreshToken(token.access_token)
      const newExpiry = Math.floor(Date.now() / 1000) + refreshed.expires_in
      saveMetaToken({
        access_token: refreshed.access_token,
        ig_user_id: token.ig_user_id,
        ig_username: token.ig_username,
        expires_at: newExpiry
      })
      token.access_token = refreshed.access_token
      token.expires_at = newExpiry
    } catch {
      // Refresh failed - continue with current token, it may still work
    }
  }

  // Fetch recent IG media (last 50)
  const media = await callGraphApi<IgMediaPage>(
    `/me/media?fields=id,caption,timestamp,media_type,permalink&limit=50`,
    token.access_token
  )

  // Get local posts for matching (only approved)
  const localPosts = listPosts(200, 0).filter(p => p.status === 'approved')

  const result: SyncResult = { synced: 0, errors: 0, unlinked: [] }

  // Fetch insights in parallel batches of 5 (E2)
  await batchParallel(media.data, async (igPost) => {
    try {
      // Try to match to a local post
      const localPost = matchCaptionPrefix(igPost, localPosts)

      if (!localPost) {
        result.unlinked.push({
          ig_media_id: igPost.id,
          caption: igPost.caption ?? null,
          timestamp: igPost.timestamp,
          permalink: igPost.permalink
        })
        return
      }

      // Fetch insights for this post
      const metrics = igPost.media_type === 'VIDEO'
        ? 'reach,likes,comments,shares,saved,plays'
        : 'reach,likes,comments,shares,saved'

      const insights = await callGraphApi<IgInsightsResponse>(
        `/${igPost.id}/insights?metric=${metrics}`,
        token.access_token
      )

      // Map insights to our performance fields
      const perfData = mapInsightsToPerformance(insights)

      // Upsert with performance score
      upsertPerformance(localPost.id, {
        ...perfData,
        source: 'api',
        ig_media_id: igPost.id
      })

      result.synced++
    } catch (err) {
      result.errors++
      console.error(`[meta-sync] Error syncing IG post ${igPost.id}:`, (err as Error).message)
    }
  }, 5)

  lastSyncAt = Date.now()
  return result
}

/**
 * Check if sync is on cooldown.
 */
export function isSyncOnCooldown(): boolean {
  return Date.now() - lastSyncAt < SYNC_COOLDOWN_MS
}

export function getLastSyncAt(): number {
  return lastSyncAt
}

/**
 * Match an IG post to a local post by caption prefix.
 * Guards: E3 edge cases.
 */
function matchCaptionPrefix(
  igPost: IgMedia,
  localPosts: Array<{ id: number; caption: string | null }>
): { id: number } | null {
  // E3: null/empty caption - skip
  if (!igPost.caption || igPost.caption.trim() === '') return null

  const igCaption = igPost.caption.trim()
  // E3: short caption - use full text
  const matchLength = igCaption.length < 25 ? igCaption.length : 50
  const igPrefix = igCaption.substring(0, matchLength).toLowerCase()

  for (const local of localPosts) {
    if (!local.caption) continue
    const localPrefix = local.caption.trim().substring(0, matchLength).toLowerCase()
    if (igPrefix === localPrefix) {
      return { id: local.id }
    }
  }

  return null
}

function mapInsightsToPerformance(insights: IgInsightsResponse): Record<string, number | null> {
  const map: Record<string, number | null> = {
    reach: null,
    likes: null,
    comments: null,
    shares: null,
    saves: null
  }

  for (const insight of insights.data) {
    const value = insight.values?.[0]?.value ?? null
    switch (insight.name) {
      case 'reach': map.reach = value; break
      case 'likes': map.likes = value; break
      case 'comments': map.comments = value; break
      case 'shares': map.shares = value; break
      case 'saved': map.saves = value; break
    }
  }

  return map
}

async function batchParallel<T>(items: T[], fn: (item: T) => Promise<void>, concurrency = 5): Promise<void> {
  for (let i = 0; i < items.length; i += concurrency) {
    await Promise.all(items.slice(i, i + concurrency).map(fn))
  }
}
