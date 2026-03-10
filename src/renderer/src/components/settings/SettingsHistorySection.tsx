import { useEffect, useState } from 'react'
import type { SettingsVersion } from '../../../../preload/types'

export function SettingsHistorySection() {
  const [versions, setVersions] = useState<SettingsVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadVersions()
  }, [])

  const loadVersions = async () => {
    try {
      setLoading(true)
      const data = await window.api.settingsVersions.list()
      setVersions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load version history')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFullDate = (timestamp: string): string => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Settings History</h2>
          <p className="text-slate-400">Loading version history...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Settings History</h2>
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">
          Settings History ({versions.length} version{versions.length !== 1 ? 's' : ''})
        </h2>
        <p className="text-slate-400">
          Every settings change is automatically saved with a timestamp. You can see which version was active when any post was created.
        </p>
      </div>

      {versions.length === 0 ? (
        <div className="p-8 border border-slate-700 rounded-lg text-center">
          <p className="text-slate-500">No settings changes recorded yet.</p>
        </div>
      ) : (
        <div className="border border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">Version</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">Timestamp</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">Backup File</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {versions.map((version, index) => (
                <tr
                  key={version.id}
                  className={index === 0 ? 'bg-slate-800/50' : 'hover:bg-slate-800/30'}
                >
                  <td className="px-4 py-3 text-slate-100">
                    {index === 0 && <span className="text-green-400 text-xs mr-2">● Current</span>}
                    v{version.version}
                  </td>
                  <td className="px-4 py-3 text-slate-300" title={formatFullDate(version.timestamp)}>
                    {formatDate(version.timestamp)}
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                    {version.filename}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
