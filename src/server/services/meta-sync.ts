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
  getPerformance,
  upsertIgPost,
  listPosts
} from '../db/queries'
import { computePerformanceScore } from '../../shared/performanceScore'

// In-memory cooldown (resets on server restart - acceptable per E5)
let lastSyncAt = 0
const SYNC_COOLDOWN_MS = 60 * 1000 // 1 minute (dev-friendly, increase for prod)

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

  // Fetch recent IG media (last 50) using stored IG user ID
  const media = await callGraphApi<IgMediaPage>(
    `/${token.ig_user_id}/media?fields=id,caption,timestamp,media_type,permalink&limit=50`,
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

      // Fetch insights for this post
      // v22+: 'plays' deprecated, 'views' replaces it. Use same metrics for all types.
      const metrics = 'reach,likes,comments,shares,saved'

      const insights = await callGraphApi<IgInsightsResponse>(
        `/${igPost.id}/insights?metric=${metrics}`,
        token.access_token
      )

      const perfData = mapInsightsToPerformance(insights)

      if (localPost) {
        // Linked to a Content Studio post - update its performance
        upsertPerformance(localPost.id, {
          ...perfData,
          source: 'api',
          ig_media_id: igPost.id
        })
      } else {
        // Standalone IG post - store in ig_posts table
        upsertIgPost({
          ig_media_id: igPost.id,
          caption: igPost.caption ?? null,
          media_type: igPost.media_type,
          permalink: igPost.permalink ?? null,
          timestamp: igPost.timestamp,
          ...perfData,
          performance_score: computePerformanceScore(perfData)
        })
        result.unlinked.push({
          ig_media_id: igPost.id,
          caption: igPost.caption ?? null,
          timestamp: igPost.timestamp,
          permalink: igPost.permalink
        })
      }

      result.synced++
    } catch (err) {
      result.errors++
      console.error(`[meta-sync] Error syncing IG post ${igPost.id}:`, (err as Error).message)
    }
  }, 5)

  // Fetch ad stats and merge spend/cost data into matched posts
  await syncAdStats(token.access_token, localPosts, result)

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

interface AdData {
  ad_spend: number | null
  cost_per_result: number | null
  link_clicks: number | null
}

/**
 * Fetch ad insights from Meta Ads API and merge spend data into matched local posts.
 * Uses META_AD_ACCOUNT_ID from .env, or auto-detects from /me/adaccounts.
 */
async function syncAdStats(
  accessToken: string,
  localPosts: Array<{ id: number; caption: string | null }>,
  result: SyncResult
): Promise<void> {
  try {
    // Find ad account
    let adAccountId = process.env.META_AD_ACCOUNT_ID
    if (!adAccountId) {
      const accounts = await callGraphApi<{ data: Array<{ id: string; name: string }> }>(
        '/me/adaccounts?fields=id,name&limit=10', accessToken
      )
      if (!accounts.data?.length) return // No ad accounts - skip silently
      adAccountId = accounts.data[0].id
    }

    // Fetch ads with inline lifetime insights
    const fields = [
      'id', 'name',
      'creative{effective_object_story_id}',
      'insights.date_preset(maximum){impressions,reach,spend,clicks,cpm,frequency,actions}'
    ].join(',')

    const adsData = await callGraphApi<{ data: Array<Record<string, unknown>> }>(
      `/${adAccountId}/ads?fields=${fields}&effective_status[]=ACTIVE&effective_status[]=PAUSED&effective_status[]=ARCHIVED&limit=100`,
      accessToken
    )

    if (!adsData.data?.length) return

    // Build caption-to-ad-data map
    for (const ad of adsData.data) {
      const ins = (ad.insights as { data?: Array<Record<string, unknown>> })?.data?.[0]
      if (!ins) continue

      // Extract caption from ad name
      const name = (ad.name as string) || ''
      const caption = name.replace(/^(Instagram-Beitrag|Instagram-Story|Hervorgehobene Website):\s*/i, '').trim()
      if (!caption) continue

      // Match to local post by caption prefix
      const clean = caption.replace(/\.{2,}$/, '').trim()
      const key = clean.slice(0, 25).toLowerCase().trim()
      if (key.length < 10) continue

      const localPost = localPosts.find(p => {
        if (!p.caption) return false
        return p.caption.trim().substring(0, 25).toLowerCase().startsWith(key)
      })

      if (!localPost) continue

      const findAction = (type: string): number | null => {
        const actions = (ins.actions as Array<{ action_type: string; value: string }>) || []
        const match = actions.find(a => a.action_type === type)
        return match ? parseInt(match.value) : null
      }

      const spend = ins.spend ? parseFloat(ins.spend as string) : null
      const reach = ins.reach ? parseInt(ins.reach as string) : null

      const adData: AdData = {
        ad_spend: spend,
        cost_per_result: spend && reach ? parseFloat((spend / reach * 1000).toFixed(2)) : null,
        link_clicks: findAction('link_click')
      }

      // Merge ad data with existing performance record (preserve IG insights)
      const existing = getPerformance(localPost.id)
      upsertPerformance(localPost.id, {
        reach: existing?.reach ?? null,
        likes: existing?.likes ?? null,
        comments: existing?.comments ?? null,
        shares: existing?.shares ?? null,
        saves: existing?.saves ?? null,
        notes: existing?.notes ?? null,
        ig_media_id: existing?.ig_media_id ?? null,
        ...adData,
        source: 'api'
      })
    }
  } catch (err) {
    // Ad fetch failure is non-fatal - log and continue
    console.error('[meta-sync] Ad stats fetch failed:', (err as Error).message)
  }
}

async function batchParallel<T>(items: T[], fn: (item: T) => Promise<void>, concurrency = 5): Promise<void> {
  for (let i = 0; i < items.length; i += concurrency) {
    await Promise.all(items.slice(i, i + concurrency).map(fn))
  }
}
