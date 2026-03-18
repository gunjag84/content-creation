import { useEffect, useState } from 'react'
import { api } from '../lib/apiClient'

interface IgPost {
  id: number
  ig_media_id: string
  caption: string | null
  media_type: string | null
  permalink: string | null
  timestamp: string | null
  reach: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  saves: number | null
  ad_spend: number | null
  cost_per_result: number | null
  link_clicks: number | null
  performance_score: number
}

type SortField = 'timestamp' | 'reach' | 'likes' | 'comments' | 'performance_score' | 'ad_spend'

export function InstagramPosts() {
  const [posts, setPosts] = useState<IgPost[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortField>('timestamp')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    api.get<IgPost[]>('/instagram/posts')
      .then(setPosts)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(field)
      setSortDir('desc')
    }
  }

  const sorted = [...posts].sort((a, b) => {
    const av = a[sortBy] ?? 0
    const bv = b[sortBy] ?? 0
    if (typeof av === 'string' && typeof bv === 'string') {
      return sortDir === 'desc' ? bv.localeCompare(av) : av.localeCompare(bv)
    }
    return sortDir === 'desc' ? (bv as number) - (av as number) : (av as number) - (bv as number)
  })

  const arrow = (field: SortField) => sortBy === field ? (sortDir === 'desc' ? ' \u25BC' : ' \u25B2') : ''

  if (loading) return <div className="p-4">Loading...</div>

  if (posts.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Instagram Posts</h1>
        <p className="text-gray-500 text-sm">No Instagram posts synced yet. Connect your account in Settings and sync from Post History.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Instagram Posts</h1>
        <span className="text-xs text-gray-400">{posts.length} posts</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-gray-500">
              <th className="py-2 pr-3 font-medium w-[40%]">Caption</th>
              <th className="py-2 px-2 font-medium cursor-pointer hover:text-gray-800" onClick={() => toggleSort('timestamp')}>
                Date{arrow('timestamp')}
              </th>
              <th className="py-2 px-2 font-medium cursor-pointer hover:text-gray-800 text-right" onClick={() => toggleSort('reach')}>
                Reach{arrow('reach')}
              </th>
              <th className="py-2 px-2 font-medium cursor-pointer hover:text-gray-800 text-right" onClick={() => toggleSort('likes')}>
                Likes{arrow('likes')}
              </th>
              <th className="py-2 px-2 font-medium cursor-pointer hover:text-gray-800 text-right" onClick={() => toggleSort('comments')}>
                Comments{arrow('comments')}
              </th>
              <th className="py-2 px-2 font-medium text-right">Shares</th>
              <th className="py-2 px-2 font-medium text-right">Saves</th>
              <th className="py-2 px-2 font-medium cursor-pointer hover:text-gray-800 text-right" onClick={() => toggleSort('ad_spend')}>
                Ad Spend{arrow('ad_spend')}
              </th>
              <th className="py-2 px-2 font-medium cursor-pointer hover:text-gray-800 text-right" onClick={() => toggleSort('performance_score')}>
                Score{arrow('performance_score')}
              </th>
              <th className="py-2 pl-2 font-medium w-8"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((post) => (
              <tr key={post.id} className="border-b hover:bg-gray-50">
                <td className="py-2 pr-3">
                  <span className="line-clamp-2 text-xs text-gray-700">
                    {post.caption ? post.caption.substring(0, 100) + (post.caption.length > 100 ? '...' : '') : '(no caption)'}
                  </span>
                </td>
                <td className="py-2 px-2 text-xs text-gray-500 whitespace-nowrap">
                  {post.timestamp ? new Date(post.timestamp).toLocaleDateString() : '--'}
                </td>
                <td className="py-2 px-2 text-right tabular-nums">{post.reach?.toLocaleString() ?? '--'}</td>
                <td className="py-2 px-2 text-right tabular-nums">{post.likes?.toLocaleString() ?? '--'}</td>
                <td className="py-2 px-2 text-right tabular-nums">{post.comments?.toLocaleString() ?? '--'}</td>
                <td className="py-2 px-2 text-right tabular-nums">{post.shares?.toLocaleString() ?? '--'}</td>
                <td className="py-2 px-2 text-right tabular-nums">{post.saves?.toLocaleString() ?? '--'}</td>
                <td className="py-2 px-2 text-right tabular-nums">
                  {post.ad_spend != null ? `${post.ad_spend.toFixed(2)}` : '--'}
                </td>
                <td className="py-2 px-2 text-right tabular-nums font-medium">
                  {post.performance_score > 0 ? Math.round(post.performance_score) : '--'}
                </td>
                <td className="py-2 pl-2">
                  {post.permalink && (
                    <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 text-xs">
                      IG
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
