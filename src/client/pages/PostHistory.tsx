import { useEffect, useState } from 'react'
import { api } from '../lib/apiClient'
import { StatsForm } from '../components/StatsForm'
import type { PostRow, PostPerformance } from '@shared/types'

interface PostDetail {
  post: PostRow
  slides: unknown[]
  performance?: PostPerformance
}

export function PostHistory() {
  const [posts, setPosts] = useState<PostRow[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)
  const [detail, setDetail] = useState<PostDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<PostRow[]>('/posts').then((data) => {
      setPosts(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

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

  if (loading) return <div className="p-4">Loading...</div>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Post History</h1>

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
                <span className="text-sm text-gray-500">{post.theme}</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{post.mechanic}</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{post.content_type}</span>
              </div>
              <div className="flex items-center gap-3">
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
                {/* Caption */}
                {detail.post.caption && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 mb-1">Caption</h3>
                    <p className="text-sm whitespace-pre-wrap bg-gray-50 rounded p-3">{detail.post.caption}</p>
                  </div>
                )}

                {/* Stats form */}
                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-2">Performance Stats</h3>
                  <StatsForm
                    postId={post.id}
                    initial={detail.performance}
                    onSaved={() => toggleExpand(post.id)} // refresh
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
