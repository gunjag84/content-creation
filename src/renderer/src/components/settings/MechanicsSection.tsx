import type { Settings } from '../../../../shared/types/settings'
import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface MechanicsSectionProps {
  settings: Settings
  onUpdate: (section: 'mechanics', value: Settings['mechanics']) => Promise<void>
}

export function MechanicsSection({ settings, onUpdate }: MechanicsSectionProps) {
  const [expandedMechanics, setExpandedMechanics] = useState<Set<string>>(new Set())

  const mechanics = settings.mechanics?.mechanics || []

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedMechanics)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setExpandedMechanics(newSet)
  }

  const toggleActive = async (id: string, active: boolean) => {
    const updated = {
      mechanics: mechanics.map(m =>
        m.id === id ? { ...m, active } : m
      )
    }
    await onUpdate('mechanics', updated)
  }

  const activeCount = mechanics.filter(m => m.active).length

  // Pillar color mapping
  const pillarColors: Record<string, string> = {
    'generate-demand': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'convert-demand': 'bg-green-500/20 text-green-300 border-green-500/30',
    'nurture-loyalty': 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-slate-100">Post Mechanics</h2>
          <span className="text-sm text-slate-400">
            {activeCount} of {mechanics.length} active
          </span>
        </div>
        <p className="text-slate-400 text-sm">
          7 content mechanics for carousel and single posts. Click to expand and view full details.
        </p>
      </div>

      <div className="space-y-3">
        {mechanics.map((mechanic) => {
          const isExpanded = expandedMechanics.has(mechanic.id)

          return (
            <Card
              key={mechanic.id}
              className={`border-slate-700 bg-slate-800/50 ${!mechanic.active ? 'opacity-60' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <button
                    onClick={() => toggleExpand(mechanic.id)}
                    className="flex-1 text-left hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M9 5l7 7-7 7"></path>
                      </svg>
                      <h3 className="font-semibold text-slate-100">{mechanic.name}</h3>
                    </div>
                    <p className="text-sm text-slate-400 ml-6">{mechanic.description}</p>
                  </button>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-slate-500">{mechanic.active ? 'Active' : 'Inactive'}</span>
                    <Switch
                      checked={mechanic.active}
                      onCheckedChange={(checked) => toggleActive(mechanic.id, checked)}
                    />
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 pb-4">
                  <div className="ml-6 space-y-4 border-t border-slate-700 pt-4">
                    {/* Hook Rules */}
                    {mechanic.hookRules && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-200 mb-2">Hook Rules</h4>
                        <p className="text-sm text-slate-400 whitespace-pre-wrap">{mechanic.hookRules}</p>
                      </div>
                    )}

                    {/* Slide Range */}
                    {mechanic.slideRange && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-200 mb-2">Slide Range</h4>
                        <p className="text-sm text-slate-400">
                          {mechanic.slideRange.min} - {mechanic.slideRange.max} slides
                        </p>
                      </div>
                    )}

                    {/* Structure Guidelines */}
                    {mechanic.structureGuidelines && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-200 mb-2">Structure Guidelines</h4>
                        <p className="text-sm text-slate-400 whitespace-pre-wrap">{mechanic.structureGuidelines}</p>
                      </div>
                    )}

                    {/* Pillar Mapping */}
                    {mechanic.pillarMapping && mechanic.pillarMapping.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-200 mb-2">Pillar Mapping</h4>
                        <div className="flex gap-2 flex-wrap">
                          {mechanic.pillarMapping.map((pillar) => (
                            <span
                              key={pillar}
                              className={`text-xs px-2 py-1 rounded border ${pillarColors[pillar] || 'bg-slate-600/20 text-slate-400 border-slate-600/30'}`}
                            >
                              {pillar.replace('-', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {mechanics.length === 0 && (
        <div className="p-8 border-2 border-dashed border-slate-700 rounded-lg text-center">
          <p className="text-slate-500">No mechanics loaded. Mechanics should be pre-loaded from blueprint data.</p>
        </div>
      )}
    </div>
  )
}
