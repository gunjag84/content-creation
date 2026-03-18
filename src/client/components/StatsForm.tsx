import { useState } from 'react'
import type { PostPerformance } from '@shared/types'
import { api } from '../lib/apiClient'

interface StatsFormProps {
  postId: number
  initial?: Partial<PostPerformance>
  onSaved?: () => void
}

const fields = [
  { key: 'reach', label: 'Reach', type: 'number' },
  { key: 'likes', label: 'Likes', type: 'number' },
  { key: 'comments', label: 'Comments', type: 'number' },
  { key: 'shares', label: 'Shares', type: 'number' },
  { key: 'saves', label: 'Saves', type: 'number' },
  { key: 'ad_spend', label: 'Ad Spend', type: 'number' },
  { key: 'cost_per_result', label: 'Cost/Result', type: 'number' },
  { key: 'link_clicks', label: 'Link Clicks', type: 'number' },
  { key: 'notes', label: 'Notes', type: 'text' }
] as const

export function StatsForm({ postId, initial, onSaved }: StatsFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {}
    for (const f of fields) {
      const val = initial?.[f.key as keyof PostPerformance]
      v[f.key] = val != null ? String(val) : ''
    }
    return v
  })
  const [saving, setSaving] = useState(false)
  const [source, setSource] = useState<string | null>(initial?.source ?? null)
  const [dirty, setDirty] = useState(false)

  const handleChange = (key: string, value: string) => {
    setValues({ ...values, [key]: value })
    // D8: any manual edit flips source to manual
    if (source === 'api' && !dirty) {
      setSource('manual')
      setDirty(true)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const data: Record<string, unknown> = {}
    for (const f of fields) {
      const v = values[f.key]
      if (v === '') { data[f.key] = null; continue }
      data[f.key] = f.type === 'number' ? parseFloat(v) : v
    }
    // Source flips to manual on any edit
    data.source = dirty ? 'manual' : (source ?? 'manual')
    await api.put(`/posts/${postId}/stats`, data)
    setSaving(false)
    onSaved?.()
  }

  const syncedAt = initial?.recorded_at && source === 'api'
    ? formatTimeSince(initial.recorded_at * 1000)
    : null

  return (
    <div className="space-y-3">
      {/* D8: Source badge */}
      {syncedAt && !dirty && (
        <span className="inline-block bg-blue-50 text-blue-600 text-xs rounded px-1.5 py-0.5">
          Synced - {syncedAt}
        </span>
      )}

      <div className="grid grid-cols-4 gap-3">
        {fields.filter(f => f.type === 'number').map((f) => (
          <div key={f.key}>
            <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
            <input
              type="number"
              value={values[f.key]}
              onChange={(e) => handleChange(f.key, e.target.value)}
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </div>
        ))}
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Notes</label>
        <textarea
          value={values.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={2}
          className="w-full border rounded px-2 py-1.5 text-sm resize-none"
        />
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Stats'}
      </button>
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
