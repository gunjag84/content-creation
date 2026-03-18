/**
 * Instagram integration routes: /api/instagram/*
 * E1: Namespace avoids collision with existing /api/posts/meta/* analytics routes.
 */

import { Router } from 'express'
import { callGraphApi, discoverIgAccount, refreshToken, ApiError } from '../services/meta-api'
import { syncIgStats, isSyncOnCooldown, getLastSyncAt, type SyncResult } from '../services/meta-sync'
import { getMetaToken, saveMetaToken, deleteMetaToken, linkIgPost } from '../db/queries'

const router = Router()

/**
 * POST /api/instagram/connect
 * Validate token, discover IG business account, save.
 */
router.post('/connect', async (req, res) => {
  try {
    const { access_token } = req.body
    if (!access_token || typeof access_token !== 'string') {
      res.status(400).json({ error: 'access_token is required' })
      return
    }

    // Discover IG business account via Facebook Page
    const account = await discoverIgAccount(access_token)

    // Try to exchange for long-lived token
    let finalToken = access_token
    let expiresAt = Math.floor(Date.now() / 1000) + 60 * 24 * 60 * 60 // fallback: 60 days

    try {
      const refreshed = await refreshToken(access_token)
      finalToken = refreshed.access_token
      expiresAt = Math.floor(Date.now() / 1000) + refreshed.expires_in
    } catch {
      // Exchange failed (token may already be long-lived) - use fallback expiry
    }

    saveMetaToken({
      access_token: finalToken,
      ig_user_id: account.ig_user_id,
      ig_username: account.username,
      expires_at: expiresAt
    })

    res.json({
      connected: true,
      username: account.username,
      expires_at: expiresAt
    })
  } catch (err) {
    if (err instanceof ApiError) {
      res.status(err.status || 500).json({ error: err.message })
      return
    }
    res.status(500).json({ error: (err as Error).message })
  }
})

/**
 * DELETE /api/instagram/connect
 * Disconnect Instagram account.
 */
router.delete('/connect', (_req, res) => {
  deleteMetaToken()
  res.json({ connected: false })
})

/**
 * GET /api/instagram/status
 * Get connection status + token health.
 */
router.get('/status', (_req, res) => {
  const token = getMetaToken()
  if (!token) {
    res.json({ connected: false })
    return
  }

  const now = Math.floor(Date.now() / 1000)
  const daysUntilExpiry = Math.floor((token.expires_at - now) / (24 * 60 * 60))

  res.json({
    connected: true,
    username: token.ig_username,
    expires_at: token.expires_at,
    days_until_expiry: daysUntilExpiry,
    expired: daysUntilExpiry <= 0,
    near_expiry: daysUntilExpiry > 0 && daysUntilExpiry <= 14,
    last_sync_at: getLastSyncAt()
  })
})

/**
 * POST /api/instagram/sync
 * Manual sync trigger with cooldown.
 */
router.post('/sync', async (_req, res) => {
  try {
    if (isSyncOnCooldown()) {
      res.status(429).json({ error: 'Sync on cooldown. Try again later.', last_sync_at: getLastSyncAt() })
      return
    }

    const result: SyncResult = await syncIgStats()
    res.json(result)
  } catch (err) {
    if (err instanceof ApiError) {
      res.status(err.status || 500).json({ error: err.message })
      return
    }
    res.status(500).json({ error: (err as Error).message })
  }
})

/**
 * POST /api/instagram/link
 * Manually link an IG post to a local post.
 */
router.post('/link', (req, res) => {
  try {
    const { ig_media_id, post_id } = req.body
    if (!ig_media_id || !post_id) {
      res.status(400).json({ error: 'ig_media_id and post_id are required' })
      return
    }

    linkIgPost(ig_media_id, Number(post_id))
    res.json({ linked: true })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router
