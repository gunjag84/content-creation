import type { Settings } from '../../../../shared/types/settings'
import { useState } from 'react'

interface ThemeSectionProps {
  settings: Settings
  onUpdate: (section: 'themes', value: Settings['themes']) => Promise<void>
}

export function ThemeSection({ settings, onUpdate }: ThemeSectionProps) {
  const [expandedOberthemen, setExpandedOberthemen] = useState<Set<string>>(new Set())
  const [expandedUnterthemen, setExpandedUnterthemen] = useState<Set<string>>(new Set())

  const themes = settings.themes

  if (!themes || !themes.oberthemen) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Themes</h2>
          <p className="text-slate-400 text-sm">No themes loaded. Themes should be pre-loaded from blueprint data.</p>
        </div>
      </div>
    )
  }

  const toggleOberthema = (id: string) => {
    const newSet = new Set(expandedOberthemen)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setExpandedOberthemen(newSet)
  }

  const toggleUnterthema = (id: string) => {
    const newSet = new Set(expandedUnterthemen)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setExpandedUnterthemen(newSet)
  }

  // Pillar color mapping
  const pillarColors: Record<string, string> = {
    'generate-demand': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'convert-demand': 'bg-green-500/20 text-green-300 border-green-500/30',
    'nurture-loyalty': 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Themes</h2>
        <p className="text-slate-400 text-sm">
          Pre-loaded theme hierarchy showing 5 Oberthemen with their Unterthemen and Kernaussagen. Read-only display.
        </p>
      </div>

      <div className="space-y-3">
        {themes.oberthemen.map((oberthema) => {
          const isExpanded = expandedOberthemen.has(oberthema.id)

          return (
            <div key={oberthema.id} className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/50">
              {/* Oberthema Header */}
              <button
                onClick={() => toggleOberthema(oberthema.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M9 5l7 7-7 7"></path>
                  </svg>
                  <div className="text-left">
                    <div className="font-semibold text-slate-100">{oberthema.name}</div>
                    {oberthema.description && (
                      <div className="text-sm text-slate-400 mt-0.5">{oberthema.description}</div>
                    )}
                  </div>
                </div>

                {/* Pillar Mapping Badges */}
                {oberthema.pillarMapping && oberthema.pillarMapping.length > 0 && (
                  <div className="flex gap-2 ml-4">
                    {oberthema.pillarMapping.map((pillar) => (
                      <span
                        key={pillar}
                        className={`text-xs px-2 py-1 rounded border ${pillarColors[pillar] || 'bg-slate-600/20 text-slate-400 border-slate-600/30'}`}
                      >
                        {pillar.replace('-', ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </button>

              {/* Unterthemen (Expanded Content) */}
              {isExpanded && (
                <div className="border-t border-slate-700 bg-slate-900/30">
                  {oberthema.unterthemen.map((unterthema) => {
                    const isUnterthemaExpanded = expandedUnterthemen.has(unterthema.id)

                    return (
                      <div key={unterthema.id} className="border-b border-slate-700/50 last:border-b-0">
                        {/* Unterthema Header */}
                        <button
                          onClick={() => toggleUnterthema(unterthema.id)}
                          className="w-full px-8 py-2.5 flex items-center justify-between hover:bg-slate-700/20 transition-colors"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <svg
                              className={`w-3 h-3 text-slate-500 transition-transform ${isUnterthemaExpanded ? 'rotate-90' : ''}`}
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path d="M9 5l7 7-7 7"></path>
                            </svg>
                            <div className="text-sm font-medium text-slate-200">{unterthema.name}</div>
                          </div>
                          <div className="text-xs text-slate-500">
                            {unterthema.kernaussagen.length} Kernaussagen
                          </div>
                        </button>

                        {/* Kernaussagen (Expanded Content) */}
                        {isUnterthemaExpanded && (
                          <div className="px-12 py-2 space-y-1">
                            {unterthema.kernaussagen.map((kernaussage) => (
                              <div
                                key={kernaussage.id}
                                className="text-sm text-slate-300 py-1.5 px-3 rounded hover:bg-slate-700/20"
                              >
                                • {kernaussage.text}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="text-xs text-slate-500 mt-4">
        Displaying {themes.oberthemen.length} Oberthemen with{' '}
        {themes.oberthemen.reduce((sum, o) => sum + o.unterthemen.length, 0)} Unterthemen total.
      </div>
    </div>
  )
}
