import { useEffect, useState } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { ContextEditor } from '../components/ContextEditor'
import { api } from '../lib/apiClient'
import type { Settings, FontLibraryEntry } from '@shared/types'
import { PRESET_FONTS } from '@shared/fonts'

const contextDocLabels: Record<string, string> = {
  brandVoice: 'Brand Voice',
  targetPersona: 'Target Persona',
  productUVP: 'Product & UVP',
  competitive: 'Competitive Landscape',
  contentStrategy: 'Content Strategy',
  pov: 'Point of View'
}

const FONT_ROLES = ['headline', 'body', 'cta'] as const
type FontRole = typeof FONT_ROLES[number]

interface BrandConfigProps {
  onBack?: () => void
}

export function BrandConfig({ onBack }: BrandConfigProps) {
  const { settings, loading, load, save } = useSettingsStore()
  const [local, setLocal] = useState<Settings | null>(null)
  const [saved, setSaved] = useState(false)
  const [uploadingFont, setUploadingFont] = useState<FontRole | null>(null)

  useEffect(() => { load() }, [])
  useEffect(() => { if (settings) setLocal(structuredClone(settings)) }, [settings])

  if (loading || !local) return <div className="p-4 text-gray-500">Loading...</div>

  const updateContextDoc = (key: string, value: string) => {
    setLocal({ ...local, contextDocs: { ...local.contextDocs, [key]: value } })
    setSaved(false)
  }

  const updateVisual = (key: string, value: unknown) => {
    setLocal({ ...local, visual: { ...local.visual, [key]: value } })
    setSaved(false)
  }

  const updateColor = (index: number, value: string) => {
    const colors = [...local.visual.colors]
    colors[index] = value
    updateVisual('colors', colors)
  }

  const handleFontSelect = (role: FontRole, value: string) => {
    updateVisual('fonts', { ...local.visual.fonts, [role]: value })
  }

  const handleUploadFont = (role: FontRole) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.ttf,.otf,.woff,.woff2'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      setUploadingFont(role)
      try {
        const result = await api.upload(file)
        const fontName = file.name.replace(/\.[^.]+$/, '') // strip extension
        const newEntry: FontLibraryEntry = { id: crypto.randomUUID(), name: fontName, path: result.path }
        // Functional updater avoids stale closure over `local` during async file picker
        setLocal(prev => {
          if (!prev) return prev
          return {
            ...prev,
            visual: {
              ...prev.visual,
              fontLibrary: [...(prev.visual.fontLibrary ?? []), newEntry],
              fonts: { ...prev.visual.fonts, [role]: `custom:${newEntry.id}` }
            }
          }
        })
        setSaved(false)
      } finally {
        setUploadingFont(null)
      }
    }
    input.click()
  }

  const handleUploadLogo = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const result = await api.upload(file)
      updateVisual('logo', result.path)
    }
    input.click()
  }

  const handleSave = async () => {
    await save(local)
    setSaved(true)
  }

  // Display name for a font value
  const fontDisplayName = (value: string): string => {
    if (!value) return 'Default'
    if (value.startsWith('custom:')) {
      const id = value.slice(7)
      const entry = (local.visual.fontLibrary ?? []).find(f => f.id === id)
      return entry ? entry.name : 'Custom'
    }
    return value
  }

  const addPillar = () => {
    setLocal({ ...local, pillars: [...local.pillars, { id: crypto.randomUUID(), name: '', targetPct: 0 }] })
  }

  const updatePillar = (index: number, field: string, value: string | number) => {
    const pillars = [...local.pillars]
    pillars[index] = { ...pillars[index], [field]: value }
    setLocal({ ...local, pillars })
    setSaved(false)
  }

  const removePillar = (index: number) => {
    setLocal({ ...local, pillars: local.pillars.filter((_, i) => i !== index) })
    setSaved(false)
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 flex items-center gap-1"
            >
              ← Back
            </button>
          )}
          <h1 className="text-2xl font-bold">Brand Configuration</h1>
        </div>
        <button
          onClick={handleSave}
          className={`px-5 py-2 rounded-lg text-sm font-medium ${
            saved ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* Context Documents */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Context Documents</h2>
        {Object.entries(contextDocLabels).map(([key, label]) => (
          <ContextEditor
            key={key}
            label={label}
            value={local.contextDocs[key as keyof typeof local.contextDocs]}
            onChange={(v) => updateContextDoc(key, v)}
            placeholder={`Describe your ${label.toLowerCase()}...`}
          />
        ))}
      </section>

      {/* Visual Identity */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Visual Identity</h2>

        {/* Colors */}
        <div className="grid grid-cols-3 gap-4">
          {['Primary', 'Secondary', 'Background'].map((label, i) => (
            <div key={i}>
              <label className="block text-xs text-gray-500 mb-1">{label} Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={local.visual.colors[i] || '#000000'}
                  onChange={(e) => updateColor(i, e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={local.visual.colors[i] || ''}
                  onChange={(e) => updateColor(i, e.target.value)}
                  className="flex-1 border rounded px-2 py-1 text-sm font-mono"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Fonts */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Fonts</h3>
          <div className="grid grid-cols-3 gap-4">
            {FONT_ROLES.map((role) => {
              const currentValue = local.visual.fonts[role] ?? ''
              const fontLibrary = local.visual.fontLibrary ?? []
              const isUploading = uploadingFont === role

              return (
                <div key={role}>
                  <label className="block text-xs text-gray-500 mb-1">
                    {role.charAt(0).toUpperCase() + role.slice(1)} Font
                  </label>

                  <select
                    value={currentValue}
                    onChange={(e) => handleFontSelect(role, e.target.value)}
                    disabled={isUploading}
                    className="w-full border rounded px-2 py-2 text-sm bg-white disabled:opacity-50"
                  >
                    <option value="">Default (sans-serif)</option>

                    <optgroup label="Preset Fonts">
                      {PRESET_FONTS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </optgroup>

                    {fontLibrary.length > 0 && (
                      <optgroup label="Custom Fonts">
                        {fontLibrary.map((f) => (
                          <option key={f.id} value={`custom:${f.id}`}>{f.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>

                  <button
                    onClick={() => handleUploadFont(role)}
                    disabled={isUploading}
                    className="mt-1.5 text-xs text-blue-600 hover:underline disabled:opacity-50 flex items-center gap-1"
                  >
                    {isUploading
                      ? <><span className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" /> Uploading...</>
                      : '+ Upload custom font...'
                    }
                  </button>

                  {currentValue && (
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {fontDisplayName(currentValue)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Custom font library list */}
          {(local.visual.fontLibrary ?? []).length > 0 && (
            <div className="mt-3 border rounded-lg p-3 bg-gray-50">
              <p className="text-xs font-medium text-gray-500 mb-2">Uploaded custom fonts</p>
              <div className="space-y-1">
                {(local.visual.fontLibrary ?? []).map((f) => (
                  <div key={f.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{f.name}</span>
                    <button
                      onClick={() => {
                        const newLibrary = (local.visual.fontLibrary ?? []).filter(e => e.id !== f.id)
                        // Reset any font role using this entry
                        const customId = `custom:${f.id}`
                        const newFonts = { ...local.visual.fonts }
                        for (const role of FONT_ROLES) {
                          if (newFonts[role] === customId) newFonts[role] = ''
                        }
                        setLocal({ ...local, visual: { ...local.visual, fontLibrary: newLibrary, fonts: newFonts } })
                        setSaved(false)
                      }}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Logo, CTA, Handle */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Logo</label>
            <button
              onClick={handleUploadLogo}
              className="w-full border border-dashed rounded py-2 text-sm text-gray-500 hover:bg-gray-50"
            >
              {local.visual.logo ? '✓ Uploaded' : 'Upload logo...'}
            </button>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Standard CTA</label>
            <input
              type="text"
              value={local.visual.cta}
              onChange={(e) => updateVisual('cta', e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Follow for more"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Handle</label>
            <input
              type="text"
              value={local.visual.handle}
              onChange={(e) => updateVisual('handle', e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="@yourhandle"
            />
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Content Pillars</h2>
          <button onClick={addPillar} className="text-sm text-blue-600 hover:underline">+ Add Pillar</button>
        </div>
        {local.pillars.map((p, i) => (
          <div key={p.id} className="flex gap-3 items-center">
            <input
              type="text"
              value={p.name}
              onChange={(e) => updatePillar(i, 'name', e.target.value)}
              className="flex-1 border rounded px-3 py-2 text-sm"
              placeholder="Pillar name"
            />
            <input
              type="number"
              value={p.targetPct}
              onChange={(e) => updatePillar(i, 'targetPct', parseInt(e.target.value) || 0)}
              className="w-20 border rounded px-2 py-2 text-sm text-center"
              min={0}
              max={100}
            />
            <span className="text-xs text-gray-400">%</span>
            <button onClick={() => removePillar(i)} className="text-red-400 hover:text-red-600 text-sm">Remove</button>
          </div>
        ))}
      </section>

      {/* Themes */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Themes</h2>
          <button
            onClick={() => setLocal({ ...local, themes: [...local.themes, { id: crypto.randomUUID(), name: '' }] })}
            className="text-sm text-blue-600 hover:underline"
          >+ Add Theme</button>
        </div>
        {local.themes.map((t, i) => (
          <div key={t.id} className="flex gap-3 items-center">
            <input
              type="text"
              value={t.name}
              onChange={(e) => {
                const themes = [...local.themes]
                themes[i] = { ...themes[i], name: e.target.value }
                setLocal({ ...local, themes })
                setSaved(false)
              }}
              className="flex-1 border rounded px-3 py-2 text-sm"
              placeholder="Theme name"
            />
            <button
              onClick={() => { setLocal({ ...local, themes: local.themes.filter((_, idx) => idx !== i) }); setSaved(false) }}
              className="text-red-400 hover:text-red-600 text-sm"
            >Remove</button>
          </div>
        ))}
      </section>

      {/* Mechanics */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Mechanics</h2>
          <button
            onClick={() => setLocal({ ...local, mechanics: [...local.mechanics, { id: crypto.randomUUID(), name: '', description: '' }] })}
            className="text-sm text-blue-600 hover:underline"
          >+ Add Mechanic</button>
        </div>
        {local.mechanics.map((m, i) => (
          <div key={m.id} className="flex gap-3 items-start">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={m.name}
                onChange={(e) => {
                  const mechanics = [...local.mechanics]
                  mechanics[i] = { ...mechanics[i], name: e.target.value }
                  setLocal({ ...local, mechanics })
                  setSaved(false)
                }}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Mechanic name"
              />
              <textarea
                value={m.description}
                onChange={(e) => {
                  const mechanics = [...local.mechanics]
                  mechanics[i] = { ...mechanics[i], description: e.target.value }
                  setLocal({ ...local, mechanics })
                  setSaved(false)
                }}
                rows={2}
                className="w-full border rounded px-3 py-2 text-sm resize-none"
                placeholder="Description"
              />
            </div>
            <button
              onClick={() => { setLocal({ ...local, mechanics: local.mechanics.filter((_, idx) => idx !== i) }); setSaved(false) }}
              className="text-red-400 hover:text-red-600 text-sm mt-2"
            >Remove</button>
          </div>
        ))}
      </section>
    </div>
  )
}
