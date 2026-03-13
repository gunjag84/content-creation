import { useEffect, useState } from 'react'
import { Button } from '../ui/button'

export function APIKeySection() {
  const [keyInput, setKeyInput] = useState('')
  const [hasKey, setHasKey] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saved' | 'deleted' | 'error'>('idle')
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    window.api.loadAPIKey().then((key) => {
      if (key) {
        setHasKey(true)
        setKeyInput(key)
      }
    })
  }, [])

  const handleSave = async () => {
    if (!keyInput.trim()) return
    try {
      await window.api.saveAPIKey(keyInput.trim())
      setHasKey(true)
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const handleDelete = async () => {
    try {
      await window.api.deleteAPIKey()
      setHasKey(false)
      setKeyInput('')
      setStatus('deleted')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-1">API Keys</h2>
        <p className="text-slate-400 text-sm">
          Keys are stored securely using the OS keychain and never written to disk.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-slate-100 font-medium">Anthropic API Key</h3>
          {hasKey && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900/50 text-green-400 border border-green-800">
              Saved
            </span>
          )}
        </div>

        <p className="text-slate-400 text-sm">
          Required for AI content generation. Get your key from{' '}
          <span className="text-blue-400">console.anthropic.com</span>.
        </p>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showKey ? 'text' : 'password'}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="sk-ant-..."
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <Button onClick={handleSave} disabled={!keyInput.trim()} className="shrink-0">
            Save
          </Button>
          {hasKey && (
            <Button
              variant="outline"
              onClick={handleDelete}
              className="shrink-0 border-red-800 text-red-400 hover:bg-red-950"
            >
              Delete
            </Button>
          )}
        </div>

        {status === 'saved' && (
          <p className="text-green-400 text-sm">Key saved successfully.</p>
        )}
        {status === 'deleted' && (
          <p className="text-slate-400 text-sm">Key deleted.</p>
        )}
        {status === 'error' && (
          <p className="text-red-400 text-sm">Failed to update key. Check system keychain permissions.</p>
        )}
      </div>
    </div>
  )
}
