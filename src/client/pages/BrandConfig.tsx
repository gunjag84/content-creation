import { useEffect, useState } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { ContextEditor } from '../components/ContextEditor'
import { api } from '../lib/apiClient'
import type { Settings } from '@shared/types'

const contextDocLabels: Record<string, string> = {
  brandVoice: 'Brand Voice',
  targetPersona: 'Target Persona',
  productUVP: 'Product & UVP',
  competitive: 'Competitive Landscape',
  contentStrategy: 'Content Strategy',
  pov: 'Point of View'
}

export function BrandConfig() {
  const { settings, loading, load, save } = useSettingsStore()
  const [local, setLocal] = useState<Settings | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => { load() }, [])
  useEffect(() => { if (settings) setLocal(structuredClone(settings)) }, [settings])

  if (loading || !local) return <div className="p-4">Loading...</div>

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

  const handleUpload = async (field: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = field === 'logo' ? 'image/*' : '.ttf,.otf,.woff,.woff2'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const result = await api.upload(file)
      if (field.startsWith('fonts.')) {
        const fontKey = field.split('.')[1]
        updateVisual('fonts', { ...local.visual.fonts, [fontKey]: result.path })
      } else {
        updateVisual(field, result.path)
      }
    }
    input.click()
  }

  const handleSave = async () => {
    await save(local)
    setSaved(true)
  }

  // Pillars list editor
  const addPillar = () => {
    setLocal({
      ...local,
      pillars: [...local.pillars, { id: crypto.randomUUID(), name: '', targetPct: 0 }]
    })
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
        <h1 className="text-2xl font-bold">Brand Configuration</h1>
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

        <div className="grid grid-cols-3 gap-4">
          {['headline', 'body', 'cta'].map((font) => (
            <div key={font}>
              <label className="block text-xs text-gray-500 mb-1">{font.charAt(0).toUpperCase() + font.slice(1)} Font</label>
              <button
                onClick={() => handleUpload(`fonts.${font}`)}
                className="w-full border border-dashed rounded py-2 text-sm text-gray-500 hover:bg-gray-50"
              >
                {local.visual.fonts[font as keyof typeof local.visual.fonts] || 'Upload font...'}
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Logo</label>
            <button
              onClick={() => handleUpload('logo')}
              className="w-full border border-dashed rounded py-2 text-sm text-gray-500 hover:bg-gray-50"
            >
              {local.visual.logo || 'Upload logo...'}
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
