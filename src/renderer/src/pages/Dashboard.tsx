import { useEffect, useState } from 'react'
import type { Settings } from '@shared/types/settings'

export function Dashboard() {
  const [appInfo, setAppInfo] = useState<{ version: string; userData: string } | null>(null)
  const [dbStatus, setDbStatus] = useState<{ ok: boolean; tables: number } | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)

  useEffect(() => {
    window.api.getAppInfo().then(setAppInfo)
    window.api.getDbStatus().then(setDbStatus)
    window.api
      .loadSettings()
      .then(setSettings)
      .catch((err) => setSettingsError(err.message))
  }, [])

  return (
    <div className="max-w-4xl">
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

      <div className="mt-8 bg-blue-950/30 border border-blue-900/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2 text-blue-300">Phase 1 Complete!</h3>
        <p className="text-slate-300 text-sm">
          Foundation is ready: Database, settings, security, and rendering pipeline are all operational.
          Navigate to Test Render to see the HTML-to-PNG rendering in action.
        </p>
      </div>
    </div>
  )
}
