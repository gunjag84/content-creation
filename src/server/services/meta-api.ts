/**
 * Instagram Graph API client + token refresh.
 */

const GRAPH_BASE = 'https://graph.instagram.com'
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
  const url = `${GRAPH_BASE}/refresh_access_token?grant_type=ig_refresh_token&access_token=${currentToken}`
  const res = await fetch(url)

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: 'Refresh failed' } })) as { error?: { message?: string } }
    throw new ApiError(body.error?.message || 'Token refresh failed', res.status)
  }

  return res.json() as Promise<{ access_token: string; expires_in: number }>
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
