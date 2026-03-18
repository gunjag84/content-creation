import { useState, useEffect } from 'react'
import { api } from '../lib/apiClient'
import type { IgConnectionStatus } from '@shared/types'

export function Settings() {
  const [status, setStatus] = useState<IgConnectionStatus | null>(null)
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      const data = await api.get<IgConnectionStatus>('/instagram/status')
      setStatus(data)
    } catch {
      setStatus({ connected: false })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStatus() }, [])

  const handleConnect = async () => {
    if (!token.trim()) return
    setConnecting(true)
    setError(null)
    try {
      const result = await api.post<{ connected: boolean; username: string; expires_at: number }>('/instagram/connect', { access_token: token.trim() })
      setStatus({
        connected: true,
        username: result.username,
        expires_at: result.expires_at,
        days_until_expiry: 60,
        expired: false,
        near_expiry: false
      })
      setToken('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await api.delete('/instagram/connect')
      setStatus({ connected: false })
      setToken('')
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  if (loading) return <div className="p-4">Loading...</div>

  const isExpired = status?.expired
  const isNearExpiry = status?.near_expiry
  const showPasteField = !status?.connected || isExpired

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="border rounded-lg p-6 space-y-4 max-w-lg">
        <h2 className="text-lg font-semibold">Instagram Connection</h2>

        {showPasteField ? (
          <>
            {isExpired && (
              <p className="text-red-500 text-sm">Token expired - please reconnect</p>
            )}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Access Token</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={token}
                  onChange={(e) => { setToken(e.target.value); setError(null) }}
                  disabled={connecting}
                  placeholder="Paste your Instagram access token"
                  className="flex-1 border rounded px-3 py-2 text-sm disabled:opacity-50"
                />
                <button
                  onClick={handleConnect}
                  disabled={connecting || !token.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {connecting && (
                    <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {connecting ? 'Connecting...' : 'Connect'}
                </button>
              </div>
              {error && (
                <p className="text-red-500 text-xs mt-1">{error}</p>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Connected: @{status?.username}</p>
                {isNearExpiry ? (
                  <p className="text-amber-600 text-xs mt-0.5">
                    Token expires in {status?.days_until_expiry} days
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Expires: {status?.expires_at
                      ? new Date(status.expires_at * 1000).toLocaleDateString()
                      : 'Unknown'}
                  </p>
                )}
              </div>
              <button
                onClick={handleDisconnect}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
