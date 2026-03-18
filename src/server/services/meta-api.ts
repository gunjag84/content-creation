/**
 * Instagram Graph API client + token refresh.
 */

const META_API_VERSION = process.env.META_API_VERSION || 'v25.0'
const GRAPH_BASE = `https://graph.facebook.com/${META_API_VERSION}`
const GRAPH_TIMEOUT = 15_000

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public retryAfter?: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function callGraphApi<T>(path: string, accessToken: string): Promise<T> {
  const url = `${GRAPH_BASE}${path}${path.includes('?') ? '&' : '?'}access_token=${accessToken}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), GRAPH_TIMEOUT)

  try {
    const res = await fetch(url, { signal: controller.signal })

    if (res.status === 401) {
      throw new ApiError('Token expired or revoked', 401)
    }
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('retry-after') || '60', 10)
      throw new ApiError('Rate limited', 429, retryAfter)
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: { message: res.statusText } })) as { error?: { message?: string } }
      throw new ApiError(body.error?.message || res.statusText, res.status)
    }

    return (await res.json()) as T
  } catch (err) {
    if (err instanceof ApiError) throw err
    if ((err as Error).name === 'AbortError') {
      throw new ApiError('Instagram unavailable (timeout)', 408)
    }
    throw new ApiError((err as Error).message || 'Network error', 0)
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Check if token needs refresh (expires within 14 days).
 */
export function tokenNeedsRefresh(expiresAt: number): boolean {
  const fourteenDays = 14 * 24 * 60 * 60
  return expiresAt - Math.floor(Date.now() / 1000) < fourteenDays
}

/**
 * Refresh a long-lived token. Returns new token + expiry.
 */
export async function refreshToken(currentToken: string): Promise<{ access_token: string; expires_in: number }> {
  const url = `${GRAPH_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${currentToken}`
  const res = await fetch(url)

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: 'Refresh failed' } })) as { error?: { message?: string } }
    throw new ApiError(body.error?.message || 'Token refresh failed', res.status)
  }

  return res.json() as Promise<{ access_token: string; expires_in: number }>
}

/**
 * Discover IG business account from a Facebook user token.
 * Flow: /me/accounts -> Page -> instagram_business_account
 */
export async function discoverIgAccount(token: string): Promise<{ ig_user_id: string; username: string; page_id: string }> {
  // Find Facebook Pages
  const pages = await callGraphApi<{ data: Array<{ id: string; name: string; access_token: string }> }>(
    '/me/accounts?fields=id,name,access_token', token
  )
  if (!pages.data?.length) {
    throw new ApiError('No Facebook Pages found on this account', 400)
  }

  // Get IG business account from first page
  const page = pages.data[0]
  const pageData = await callGraphApi<{ instagram_business_account?: { id: string } }>(
    `/${page.id}?fields=instagram_business_account`, token
  )
  const igId = pageData.instagram_business_account?.id
  if (!igId) {
    throw new ApiError('No Instagram Business Account linked to this Facebook Page', 400)
  }

  // Get IG username
  const igUser = await callGraphApi<{ id: string; username: string }>(
    `/${igId}?fields=id,username`, token
  )

  return { ig_user_id: igId, username: igUser.username, page_id: page.id }
}

// --- Graph API response types ---

export interface IgUser {
  id: string
  username: string
}

export interface IgMedia {
  id: string
  caption?: string
  timestamp: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  permalink?: string
}

export interface IgMediaPage {
  data: IgMedia[]
  paging?: { cursors?: { after?: string }; next?: string }
}

export interface IgInsight {
  name: string
  values: Array<{ value: number }>
}

export interface IgInsightsResponse {
  data: IgInsight[]
}
