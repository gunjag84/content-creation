import type { Settings } from '../../../../shared/types/settings'
import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface StoryToolsSectionProps {
  settings: Settings
  onUpdate: (section: 'storyTools', value: Settings['storyTools']) => Promise<void>
}

export function StoryToolsSection({ settings, onUpdate }: StoryToolsSectionProps) {
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set())

  const tools = settings.storyTools?.tools || []

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedTools)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setExpandedTools(newSet)
  }

  const toggleActive = async (id: string, active: boolean) => {
    const updated = {
      tools: tools.map(t =>
        t.id === id ? { ...t, active } : t
      )
    }
    await onUpdate('storyTools', updated)
  }

  const activeCount = tools.filter(t => t.active).length

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
          <h2 className="text-2xl font-bold text-slate-100">Story Tools</h2>
          <span className="text-sm text-slate-400">
            {activeCount} of {tools.length} active
          </span>
        </div>
        <p className="text-slate-400 text-sm">
          18 Instagram interactive story tools. Click to expand and view engagement types and recommendations.
        </p>
      </div>

      <div className="space-y-3">
        {tools.map((tool) => {
          const isExpanded = expandedTools.has(tool.id)

          return (
            <Card
              key={tool.id}
              className={`border-slate-700 bg-slate-800/50 ${!tool.active ? 'opacity-60' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <button
                    onClick={() => toggleExpand(tool.id)}
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
                      <h3 className="font-semibold text-slate-100">{tool.name}</h3>
                    </div>
                    <p className="text-sm text-slate-400 ml-6">{tool.description}</p>
                  </button>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-slate-500">{tool.active ? 'Active' : 'Inactive'}</span>
                    <Switch
                      checked={tool.active}
                      onCheckedChange={(checked) => toggleActive(tool.id, checked)}
                    />
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 pb-4">
                  <div className="ml-6 space-y-4 border-t border-slate-700 pt-4">
                    {/* Engagement Type */}
                    {tool.engagementType && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-200 mb-2">Engagement Type</h4>
                        <p className="text-sm text-slate-400">{tool.engagementType}</p>
                      </div>
                    )}

                    {/* Pillar Mapping */}
                    {tool.pillarMapping && tool.pillarMapping.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-200 mb-2">Pillar Mapping</h4>
                        <div className="flex gap-2 flex-wrap">
                          {tool.pillarMapping.map((pillar) => (
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

                    {/* Mechanic Recommendations */}
                    {tool.mechanicRecommendations && tool.mechanicRecommendations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-200 mb-2">Mechanic Recommendations</h4>
                        <div className="flex gap-2 flex-wrap">
                          {tool.mechanicRecommendations.map((mechanic, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 rounded bg-slate-700/50 text-slate-300 border border-slate-600/30"
                            >
                              {mechanic}
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

      {tools.length === 0 && (
        <div className="p-8 border-2 border-dashed border-slate-700 rounded-lg text-center">
          <p className="text-slate-500">No story tools loaded. Tools should be pre-loaded from blueprint data.</p>
        </div>
      )}
    </div>
  )
}
