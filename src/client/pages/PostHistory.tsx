import { useEffect, useState, useCallback, useRef } from 'react'
import { api } from '../lib/apiClient'
import { StatsForm } from '../components/StatsForm'
import type { PostRow, PostPerformance, IgConnectionStatus } from '@shared/types'

interface PostWithScore extends PostRow {
  performance_score: number | null
  perf_source: string | null
}

interface PostDetail {
  post: PostRow
  slides: unknown[]
  performance?: PostPerformance
}

interface SyncResult {
  synced: number
  errors: number
  unlinked: Array<{
    ig_media_id: string
    caption: string | null
    timestamp: string
    permalink?: string
  }>
}

type BannerType = 'success' | 'error' | 'partial' | null

export function PostHistory() {
  const [posts, setPosts] = useState<PostWithScore[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)
  const [detail, setDetail] = useState<PostDetail | null>(null)
  const [loading, setLoading] = useState(true)

  // Instagram sync state
  const [igStatus, setIgStatus] = useState<IgConnectionStatus | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [banner, setBanner] = useState<{ type: BannerType; message: string } | null>(null)
  const [unlinkedPosts, setUnlinkedPosts] = useState<SyncResult['unlinked']>([])
  const [showUnlinked, setShowUnlinked] = useState(false)
  const bannerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load posts (with scores via JOIN) + IG status in parallel
  useEffect(() => {
    Promise.all([
      api.get<PostWithScore[]>('/posts'),
      api.get<IgConnectionStatus>('/instagram/status').catch(() => ({ connected: false }) as IgConnectionStatus)
    ]).then(([postsData, status]) => {
      setPosts(postsData)
      setIgStatus(status)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // Auto-sync on mount if connected + >15 min since last sync (D5: silent)
  useEffect(() => {
    if (!igStatus?.connected) return
    const fifteenMin = 15 * 60 * 1000
    const lastSync = (igStatus.last_sync_at || 0)
    if (Date.now() - lastSync < fifteenMin) return

    // Auto-sync - show results so user doesn't need to click again
    api.post<SyncResult>('/instagram/sync', {}).then((result) => {
      if (result.unlinked.length > 0) {
        setUnlinkedPosts(result.unlinked)
      }
      setBanner({ type: 'success', message: `Auto-sync: ${result.synced} synced, ${result.unlinked.length} unlinked` })
      // Refresh posts to get updated scores
      api.get<PostWithScore[]>('/posts').then(setPosts)
      setIgStatus(prev => prev ? { ...prev, last_sync_at: Date.now() } : prev)
    }).catch(() => {
      // Silent failure
    })
  }, [igStatus?.connected]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSync = useCallback(async () => {
    if (syncing) return
    setSyncing(true)
    setBanner(null)
    if (bannerTimeout.current) clearTimeout(bannerTimeout.current)

    try {
      const result = await api.post<SyncResult>('/instagram/sync', {})

      if (result.errors > 0 && result.synced > 0) {
        setBanner({ type: 'partial', message: `${result.synced} synced, ${result.errors} errors, ${result.unlinked.length} unlinked` })
      } else if (result.errors > 0) {
        setBanner({ type: 'error', message: `Sync failed: ${result.errors} errors` })
      } else {
        setBanner({ type: 'success', message: `${result.synced} posts synced, ${result.unlinked.length} unlinked` })
      }

      if (result.unlinked.length > 0) {
        setUnlinkedPosts(result.unlinked)
      } else {
        setUnlinkedPosts([])
      }

      // Refresh posts
      const refreshed = await api.get<PostWithScore[]>('/posts')
      setPosts(refreshed)
      setIgStatus(prev => prev ? { ...prev, last_sync_at: Date.now() } : prev)

      // Auto-dismiss success banner after 8s
      if (result.errors === 0) {
        bannerTimeout.current = setTimeout(() => setBanner(null), 8000)
      }
    } catch (err) {
      setBanner({ type: 'error', message: (err as Error).message })
    } finally {
      setSyncing(false)
    }
  }, [syncing])

  const handleLink = async (igMediaId: string, postId: number) => {
    try {
      await api.post('/instagram/link', { ig_media_id: igMediaId, post_id: postId })
      setUnlinkedPosts(prev => prev.filter(p => p.ig_media_id !== igMediaId))
    } catch (err) {
      console.error('Link failed:', (err as Error).message)
    }
  }

  const handleSkip = (igMediaId: string) => {
    setUnlinkedPosts(prev => prev.filter(p => p.ig_media_id !== igMediaId))
  }

  const toggleExpand = async (postId: number) => {
    if (expanded === postId) {
      setExpanded(null)
      setDetail(null)
      return
    }
    setExpanded(postId)
    const data = await api.get<PostDetail>(`/posts/${postId}`)
    setDetail(data)
  }

  const getScore = (post: PostWithScore): string => {
    if (post.performance_score == null || post.performance_score === 0) return '--'
    return String(Math.round(post.performance_score))
  }

  if (loading) return <div className="p-4">Loading...</div>

  const lastSyncFormatted = igStatus?.last_sync_at
    ? formatTimeSince(igStatus.last_sync_at)
    : null

  return (
    <div className="space-y-4">
      {/* Header + Sync bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Post History</h1>
          {igStatus?.connected && lastSyncFormatted && (
            <p className="text-xs text-gray-400 mt-0.5">
              Last synced: {lastSyncFormatted} - @{igStatus.username}
            </p>
          )}
        </div>
        {igStatus?.connected ? (
          <button
            onClick={handleSync}
            disabled={syncing}
            aria-label="Sync from Instagram"
            className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
          >
            {syncing ? (
              <>
                <span className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                Syncing...
              </>
            ) : (
              'Sync \u21BB'
            )}
          </button>
        ) : (
          <button
            disabled
            title="Connect in Settings"
            className="px-3 py-1.5 border rounded text-sm opacity-50 cursor-not-allowed"
          >
            Sync \u21BB
          </button>
        )}
      </div>

      {/* Sync result banner (D4) */}
      {banner && (
        <div className={`rounded-lg p-3 text-sm flex items-center justify-between ${
          banner.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
          banner.type === 'partial' ? 'bg-amber-50 border border-amber-200 text-amber-700' :
          'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <span>
            {banner.type === 'success' && '\u2713 '}
            {banner.type === 'partial' && '\u26A0 '}
            {banner.type === 'error' && '\u2716 '}
            {banner.message}
          </span>
          <button onClick={() => setBanner(null)} className="text-xs opacity-70 hover:opacity-100">
            dismiss
          </button>
        </div>
      )}

      {/* Unlinked posts warning (D6) */}
      {unlinkedPosts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg">
          <button
            onClick={() => setShowUnlinked(!showUnlinked)}
            aria-expanded={showUnlinked}
            className="w-full flex items-center justify-between p-3 text-sm text-amber-700"
          >
            <span>{'\u26A0'} {unlinkedPosts.length} unlinked Instagram post{unlinkedPosts.length !== 1 ? 's' : ''}</span>
            <span>{showUnlinked ? 'Collapse' : 'Review'}</span>
          </button>

          {showUnlinked && (
            <div className="border-t border-amber-200 divide-y divide-amber-100">
              {unlinkedPosts.map((igPost) => (
                <div key={igPost.ig_media_id} className="p-3 space-y-2">
                  <p className="text-sm text-gray-700 truncate">
                    {igPost.caption ? `"${igPost.caption.substring(0, 80)}${igPost.caption.length > 80 ? '...' : ''}"` : '(no caption)'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(igPost.timestamp).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2">
                    <select
                      className="flex-1 border rounded px-2 py-1 text-sm"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) handleLink(igPost.ig_media_id, Number(e.target.value))
                      }}
                    >
                      <option value="">Select a post</option>
                      {posts.map(p => (
                        <option key={p.id} value={p.id}>
                          #{p.id} - {p.caption?.substring(0, 40) || p.pillar} - {new Date(p.created_at * 1000).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleSkip(igPost.ig_media_id)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {posts.length === 0 && (
        <p className="text-gray-500 text-sm">No posts yet. Create your first post to see it here.</p>
      )}

      <div className="space-y-2">
        {posts.map((post) => (
          <div key={post.id} className="border rounded-lg">
            <button
              onClick={() => toggleExpand(post.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
            >
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-gray-400">#{post.id}</span>
                <span className="text-sm font-medium">{post.pillar}</span>
                {post.area && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">{post.area}</span>}
                {post.angle && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{post.angle}</span>}
                {post.method && <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">{post.method}</span>}
                {post.tonality && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">{post.tonality}</span>}
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{post.content_type}</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Score badge (D7) */}
                <span className="text-sm text-gray-500 tabular-nums w-12 text-right">
                  {getScore(post)}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  post.status === 'approved' ? 'bg-green-100 text-green-700' :
                  post.status === 'exported' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>{post.status}</span>
                <span className="text-xs text-gray-400">
                  {new Date(post.created_at * 1000).toLocaleDateString()}
                </span>
              </div>
            </button>

            {expanded === post.id && detail && (
              <div className="border-t px-4 py-4 space-y-4">
                {detail.post.caption && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 mb-1">Caption</h3>
                    <p className="text-sm whitespace-pre-wrap bg-gray-50 rounded p-3">{detail.post.caption}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-2">Performance Stats</h3>
                  <StatsForm
                    postId={post.id}
                    initial={detail.performance}
                    onSaved={async () => {
                      const refreshed = await api.get<PostWithScore[]>('/posts')
                      setPosts(refreshed)
                      toggleExpand(post.id)
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function formatTimeSince(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
