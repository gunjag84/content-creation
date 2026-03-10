import { useEffect, useState } from 'react'

export function Dashboard() {
  const [appInfo, setAppInfo] = useState<{ version: string; userData: string } | null>(null)
  const [dbStatus, setDbStatus] = useState<{ ok: boolean; tables: number } | null>(null)

  useEffect(() => {
    // Load app info
    window.api.getAppInfo().then(setAppInfo)

    // Load DB status
    window.api.getDbStatus().then(setDbStatus)
  }, [])

  return (
    <div className="max-w-4xl">
      <h1 className="text-4xl font-bold mb-2 text-slate-100">
        Content Creation System
      </h1>
      <p className="text-slate-400 mb-8">
        AI-powered Instagram content creation for branded feed posts and stories
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* App Info Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-slate-100">App Information</h2>
          {appInfo ? (
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-400">Version:</span>{' '}
                <span className="text-slate-200">{appInfo.version}</span>
              </div>
              <div>
                <span className="text-slate-400">Data Directory:</span>{' '}
                <span className="text-slate-200 text-xs break-all">{appInfo.userData}</span>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Loading...</p>
          )}
        </div>

        {/* Database Status Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-slate-100">Database Status</h2>
          {dbStatus ? (
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-400">Status:</span>{' '}
                <span className={dbStatus.ok ? 'text-green-400' : 'text-red-400'}>
                  {dbStatus.ok ? 'Connected' : 'Not initialized'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Tables:</span>{' '}
                <span className="text-slate-200">{dbStatus.tables}</span>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Loading...</p>
          )}
        </div>
      </div>

      <div className="mt-8 bg-blue-950/30 border border-blue-900/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2 text-blue-300">Welcome!</h3>
        <p className="text-slate-300 text-sm">
          This is the foundation of your content creation system. The database and settings
          integration will be completed in the next plan. For now, you can explore the interface
          and navigation.
        </p>
      </div>
    </div>
  )
}
