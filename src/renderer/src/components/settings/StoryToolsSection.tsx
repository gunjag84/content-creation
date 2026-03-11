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
  const [editingTool, setEditingTool] = useState<(typeof tools[0]) | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    engagementType: '',
    pillarMapping: [] as string[],
    mechanicRecommendations: '',
  })

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

  const handleCreate = () => {
    setFormData({ name: '', description: '', engagementType: '', pillarMapping: [], mechanicRecommendations: '' })
    setEditingTool(null)
    setIsCreating(true)
  }

  const handleEdit = (tool: typeof tools[0]) => {
    setFormData({
      name: tool.name,
      description: tool.description,
      engagementType: tool.engagementType || '',
      pillarMapping: tool.pillarMapping || [],
      mechanicRecommendations: tool.mechanicRecommendations?.join('\n') || '',
    })
    setEditingTool(tool)
    setIsCreating(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) return

    const newTool = {
      id: editingTool?.id || `tool-${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description.trim(),
      engagementType: formData.engagementType.trim() || undefined,
      pillarMapping: formData.pillarMapping.length > 0 ? formData.pillarMapping : undefined,
      mechanicRecommendations: formData.mechanicRecommendations.split('\n').map(s => s.trim()).filter(Boolean).length > 0
        ? formData.mechanicRecommendations.split('\n').map(s => s.trim()).filter(Boolean)
        : undefined,
      active: editingTool?.active ?? true,
    }

    let updated
    if (editingTool) {
      updated = { tools: tools.map(t => t.id === editingTool.id ? newTool : t) }
    } else {
      updated = { tools: [...tools, newTool] }
    }

    await onUpdate('storyTools', updated)
    setIsCreating(false)
    setEditingTool(null)
  }

  const handleDelete = async (id: string) => {
    await onUpdate('storyTools', { tools: tools.filter(t => t.id !== id) })
    setDeleteConfirm(null)
  }

  const togglePillar = (pillar: string) => {
    setFormData(prev => ({
      ...prev,
      pillarMapping: prev.pillarMapping.includes(pillar)
        ? prev.pillarMapping.filter(p => p !== pillar)
        : [...prev.pillarMapping, pillar]
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-slate-100">Story Tools</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">{activeCount} of {tools.length} active</span>
            <button
              onClick={handleCreate}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              + Add Story Tool
            </button>
          </div>
        </div>
        <p className="text-slate-400 text-sm">
          Instagram interactive story tools. Click to expand and view engagement types and recommendations.
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
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(tool) }}
                      className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(tool.id) }}
                      className="px-2 py-1 text-xs text-red-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                    >
                      Delete
                    </button>
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

      {/* Create/Edit Dialog */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">
              {editingTool ? 'Edit Story Tool' : 'Add Story Tool'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Name *</label>
                <input value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))}
                  className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 text-slate-100 rounded-md" placeholder="Tool name" />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Description *</label>
                <textarea value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))}
                  rows={2} className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 text-slate-100 rounded-md resize-none" placeholder="Brief description" />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Engagement Type</label>
                <input value={formData.engagementType} onChange={e => setFormData(p => ({...p, engagementType: e.target.value}))}
                  className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 text-slate-100 rounded-md" placeholder="e.g., Poll, Quiz, Slider" />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Pillar Mapping</label>
                <div className="flex gap-2 flex-wrap">
                  {['generate-demand', 'convert-demand', 'nurture-loyalty'].map(pillar => (
                    <button key={pillar} type="button" onClick={() => togglePillar(pillar)}
                      className={`px-3 py-1 text-xs rounded border transition-colors ${
                        formData.pillarMapping.includes(pillar)
                          ? pillarColors[pillar] + ' border-current'
                          : 'border-slate-600 text-slate-400 hover:border-slate-400'
                      }`}>
                      {pillar.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Mechanic Recommendations</label>
                <textarea value={formData.mechanicRecommendations} onChange={e => setFormData(p => ({...p, mechanicRecommendations: e.target.value}))}
                  rows={3} className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 text-slate-100 rounded-md resize-none" placeholder="One mechanic per line..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={!formData.name.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md transition-colors">
                {editingTool ? 'Save Changes' : 'Add Story Tool'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Delete Story Tool?</h3>
            <p className="text-slate-400 text-sm mb-6">
              This will permanently remove "{tools.find(t => t.id === deleteConfirm)?.name}". This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
