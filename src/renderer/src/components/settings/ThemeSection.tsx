import type { Settings } from '../../../../shared/types/settings'
import { useState } from 'react'

interface ThemeSectionProps {
  settings: Settings
  onUpdate: (section: 'themes', value: Settings['themes']) => Promise<void>
}

export function ThemeSection({ settings, onUpdate }: ThemeSectionProps) {
  const [expandedOberthemen, setExpandedOberthemen] = useState<Set<string>>(new Set())
  const [expandedUnterthemen, setExpandedUnterthemen] = useState<Set<string>>(new Set())
  const [editingTheme, setEditingTheme] = useState<(typeof themes.oberthemen[0]) | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pillarMapping: [] as string[],
  })

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

  const handleCreate = () => {
    setFormData({ name: '', description: '', pillarMapping: [] })
    setEditingTheme(null)
    setIsCreating(true)
  }

  const handleEdit = (oberthema: typeof themes.oberthemen[0]) => {
    setFormData({
      name: oberthema.name,
      description: oberthema.description || '',
      pillarMapping: oberthema.pillarMapping || [],
    })
    setEditingTheme(oberthema)
    setIsCreating(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) return

    const newTheme = {
      id: editingTheme?.id || `theme-${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      pillarMapping: formData.pillarMapping.length > 0 ? formData.pillarMapping : undefined,
      unterthemen: editingTheme?.unterthemen || [],
    }

    const updated = editingTheme
      ? { oberthemen: themes.oberthemen.map(o => o.id === editingTheme.id ? newTheme : o) }
      : { oberthemen: [...themes.oberthemen, newTheme] }

    await onUpdate('themes', updated)
    setIsCreating(false)
    setEditingTheme(null)
  }

  const handleDelete = async (id: string) => {
    await onUpdate('themes', { oberthemen: themes.oberthemen.filter(o => o.id !== id) })
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
          <h2 className="text-2xl font-bold text-slate-100">Themes</h2>
          <button
            onClick={handleCreate}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            + Add Theme
          </button>
        </div>
        <p className="text-slate-400 text-sm">
          Theme hierarchy with Oberthemen, Unterthemen, and Kernaussagen. Add/Edit/Delete at Oberthema level.
        </p>
      </div>

      <div className="space-y-3">
        {themes.oberthemen.map((oberthema) => {
          const isExpanded = expandedOberthemen.has(oberthema.id)

          return (
            <div key={oberthema.id} className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/50">
              {/* Oberthema Header */}
              <div className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/30 transition-colors">
                <button
                  onClick={() => toggleOberthema(oberthema.id)}
                  className="flex-1 flex items-center gap-3 text-left"
                >
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
                </button>

                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  {/* Pillar Mapping Badges */}
                  {oberthema.pillarMapping && oberthema.pillarMapping.length > 0 && (
                    <div className="flex gap-2">
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
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(oberthema) }}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(oberthema.id) }}
                    className="px-2 py-1 text-xs text-red-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

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

      {/* Create/Edit Dialog */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">
              {editingTheme ? 'Edit Theme' : 'Add Theme'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Name *</label>
                <input value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))}
                  className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 text-slate-100 rounded-md" placeholder="Oberthema name" />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Description</label>
                <textarea value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))}
                  rows={2} className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 text-slate-100 rounded-md resize-none" placeholder="Brief description" />
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
              {editingTheme && (
                <p className="text-xs text-slate-400">
                  Note: Editing only updates the Oberthema metadata. Unterthemen and Kernaussagen are preserved as-is.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={!formData.name.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md transition-colors">
                {editingTheme ? 'Save Changes' : 'Add Theme'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Delete Theme?</h3>
            <p className="text-slate-400 text-sm mb-6">
              This will permanently remove "{themes.oberthemen.find(o => o.id === deleteConfirm)?.name}" and all its Unterthemen and Kernaussagen. This cannot be undone.
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
