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
  const [editingMechanic, setEditingMechanic] = useState<(typeof mechanics[0]) | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hookRules: '',
    slideRangeMin: 3,
    slideRangeMax: 7,
    structureGuidelines: '',
    pillarMapping: [] as string[],
  })

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

  const handleCreate = () => {
    setFormData({ name: '', description: '', hookRules: '', slideRangeMin: 3, slideRangeMax: 7, structureGuidelines: '', pillarMapping: [] })
    setEditingMechanic(null)
    setIsCreating(true)
  }

  const normalizePillar = (p: string): string => p.toLowerCase().replace(/\s+/g, '-')

  const handleEdit = (mechanic: typeof mechanics[0]) => {
    setFormData({
      name: mechanic.name,
      description: mechanic.description,
      hookRules: mechanic.hookRules || '',
      slideRangeMin: mechanic.slideRange?.min || 3,
      slideRangeMax: mechanic.slideRange?.max || 7,
      structureGuidelines: mechanic.structureGuidelines || '',
      pillarMapping: (mechanic.pillarMapping || []).map(normalizePillar),
    })
    setEditingMechanic(mechanic)
    setIsCreating(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) return

    const newMechanic = {
      id: editingMechanic?.id || `mechanic-${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description.trim(),
      hookRules: formData.hookRules.trim() || undefined,
      slideRange: { min: formData.slideRangeMin, max: formData.slideRangeMax },
      structureGuidelines: formData.structureGuidelines.trim() || undefined,
      pillarMapping: formData.pillarMapping.length > 0 ? formData.pillarMapping : undefined,
      active: editingMechanic?.active ?? true,
    }

    let updated
    if (editingMechanic) {
      updated = { mechanics: mechanics.map(m => m.id === editingMechanic.id ? newMechanic : m) }
    } else {
      updated = { mechanics: [...mechanics, newMechanic] }
    }

    await onUpdate('mechanics', updated)
    setIsCreating(false)
    setEditingMechanic(null)
  }

  const handleDelete = async (id: string) => {
    await onUpdate('mechanics', { mechanics: mechanics.filter(m => m.id !== id) })
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
          <h2 className="text-2xl font-bold text-slate-100">Post Mechanics</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">{activeCount} of {mechanics.length} active</span>
            <button
              onClick={handleCreate}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              + Add Mechanic
            </button>
          </div>
        </div>
        <p className="text-slate-400 text-sm">
          Content mechanics for carousel and single posts. Click to expand and view full details.
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
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(mechanic) }}
                      className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(mechanic.id) }}
                      className="px-2 py-1 text-xs text-red-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                    >
                      Delete
                    </button>
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

      {/* Create/Edit Dialog */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">
              {editingMechanic ? 'Edit Mechanic' : 'Add Mechanic'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Name *</label>
                <input value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))}
                  className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 text-slate-100 rounded-md" placeholder="Mechanic name" />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Description *</label>
                <textarea value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))}
                  rows={2} className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 text-slate-100 rounded-md resize-none" placeholder="Brief description" />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Hook Rules</label>
                <textarea value={formData.hookRules} onChange={e => setFormData(p => ({...p, hookRules: e.target.value}))}
                  rows={3} className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 text-slate-100 rounded-md resize-none" placeholder="Rules for writing hooks..." />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm text-slate-300 mb-1 block">Min Slides</label>
                  <input type="number" min={1} max={20} value={formData.slideRangeMin}
                    onChange={e => setFormData(p => ({...p, slideRangeMin: parseInt(e.target.value) || 3}))}
                    className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 text-slate-100 rounded-md" />
                </div>
                <div className="flex-1">
                  <label className="text-sm text-slate-300 mb-1 block">Max Slides</label>
                  <input type="number" min={1} max={20} value={formData.slideRangeMax}
                    onChange={e => setFormData(p => ({...p, slideRangeMax: parseInt(e.target.value) || 7}))}
                    className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 text-slate-100 rounded-md" />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Structure Guidelines</label>
                <textarea value={formData.structureGuidelines} onChange={e => setFormData(p => ({...p, structureGuidelines: e.target.value}))}
                  rows={3} className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 text-slate-100 rounded-md resize-none" placeholder="How to structure slides..." />
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
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={!formData.name.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md transition-colors">
                {editingMechanic ? 'Save Changes' : 'Add Mechanic'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Delete Mechanic?</h3>
            <p className="text-slate-400 text-sm mb-6">
              This will permanently remove "{mechanics.find(m => m.id === deleteConfirm)?.name}". This cannot be undone.
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
