import { useEffect, useState } from 'react'
import type { Settings } from '@shared/types/settings'
import type { NavItem } from '../components/layout/Sidebar'
import { BalanceWidget } from '../components/BalanceWidget'

interface DashboardProps {
  onNavigate: (item: NavItem) => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [appInfo, setAppInfo] = useState<{ version: string; userData: string } | null>(null)
  const [dbStatus, setDbStatus] = useState<{ ok: boolean; tables: number } | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [ipcError, setIpcError] = useState<string | null>(null)

  useEffect(() => {
    const api = typeof window !== 'undefined' ? window.api : undefined
    if (!api) {
      setAppInfo({ version: 'web', userData: '' })
      setDbStatus({ ok: false, tables: 0 })
      setIpcError('Electron API not available (running in browser)')
      return
    }
    api.getAppInfo().then(setAppInfo).catch((err) => {
      console.error('getAppInfo failed:', err)
      setIpcError(err.message)
      setAppInfo({ version: 'unknown', userData: '' })
    })
    api.getDbStatus().then(setDbStatus).catch((err) => {
      console.error('getDbStatus failed:', err)
      setIpcError(err.message)
      setDbStatus({ ok: false, tables: 0 })
    })
    api
      .loadSettings()
      .then(setSettings)
      .catch((err) => setSettingsError(err.message))
  }, [])

  return (
    <div className="px-6 py-6">
      <h1 className="text-4xl font-bold mb-2 text-slate-100">
        Content Creation System
      </h1>
      <p className="text-slate-400 mb-8">
        AI-powered Instagram content creation for branded feed posts and stories
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-slate-100">Database</h2>
          {dbStatus ? (
            <div className="flex items-center gap-2">
              <div className={'w-3 h-3 rounded-full ' + (dbStatus.ok ? 'bg-green-400' : 'bg-red-400')}></div>
              <span className="text-slate-300 text-sm">
                {dbStatus.ok ? 'Connected (' + dbStatus.tables + ' tables)' : 'Not initialized'}
              </span>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Loading...</p>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-slate-100">Settings</h2>
          {settings ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="text-slate-300 text-sm">Loaded</span>
            </div>
          ) : settingsError ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <span className="text-slate-300 text-sm">Error</span>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Loading...</p>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-slate-100">App Version</h2>
          {appInfo ? (
            <span className="text-slate-300 text-sm">{appInfo.version}</span>
          ) : (
            <p className="text-slate-500 text-sm">Loading...</p>
          )}
        </div>
      </div>

      {/* Balance Widget */}
      <div className="mt-8">
        <BalanceWidget onNavigate={onNavigate} />
      </div>
    </div>
  )
}
