import { useEffect, useRef, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { useSettingsStore } from '../stores/settingsStore'
import { ContextEditor } from '../components/ContextEditor'
import { DimensionListEditor } from '../components/DimensionListEditor'
import { api } from '../lib/apiClient'
import type { Settings, FontLibraryEntry } from '@shared/types'
import { PRESET_FONTS } from '@shared/fonts'
import { toHex } from '@shared/colorUtils'

function InfoPopover({ text }: { text: string }) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold text-gray-400 border border-gray-300 hover:text-blue-600 hover:border-blue-400 transition-colors leading-none"
          aria-label="More information"
        >
          i
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="right"
          align="center"
          sideOffset={8}
          className="z-50 max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-600 shadow-md"
        >
          {text}
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

const contextDocLabels: Record<string, string> = {
  brandVoice: 'Brand Voice',
  targetPersona: 'Target Persona',
  productUVP: 'Product & UVP',
  competitive: 'Competitive Landscape',
  hooks: 'Hooks',
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
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const localRef = useRef<Settings | null>(null)
  localRef.current = local

  useEffect(() => { load() }, [])
  // Only sync from server on initial load (when local is null), not after saves
  useEffect(() => {
    if (settings && local === null) setLocal(structuredClone(settings))
  }, [settings])

  // Debounced auto-save: 1s after any local change
  useEffect(() => {
    if (!local) return
    setSaved(false)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      if (localRef.current) {
        await save(localRef.current)
        setSaved(true)
      }
    }, 1000)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [local])

  if (loading || !local) return <div className="p-4 text-gray-500">Loading...</div>

  const updateContextDoc = (key: string, value: string) => {
    setLocal({ ...local, contextDocs: { ...local.contextDocs, [key]: value } })
  }

  const updateVisual = (key: string, value: unknown) => {
    setLocal({ ...local, visual: { ...local.visual, [key]: value } })
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

  const addPillar = () => {
    setLocal({ ...local, pillars: [...local.pillars, { id: crypto.randomUUID(), name: '', targetPct: 0, rules: '', angles: [], allowedTonalities: [], allowedMethods: [], areaRequired: true }] })
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
                  value={toHex(local.visual.colors[i] || '')}
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
              const isCustomSelected = currentValue.startsWith('custom:')
              const selectedCustomId = isCustomSelected ? currentValue.slice(7) : null
              const fontSizeKey = role === 'headline' ? 'headline' : role === 'body' ? 'body' : 'cta'
              const fontSize = local.visual.fontSizes?.[fontSizeKey] ?? (role === 'headline' ? 56 : role === 'body' ? 38 : 48)

              return (
                <div key={role}>
                  <label className="block text-xs text-gray-500 mb-1">
                    {role.charAt(0).toUpperCase() + role.slice(1)} Font
                  </label>

                  <div className="flex gap-1.5 items-center">
                    <select
                      value={currentValue}
                      onChange={(e) => handleFontSelect(role, e.target.value)}
                      disabled={isUploading}
                      className="flex-1 border rounded px-2 py-2 text-sm bg-white disabled:opacity-50"
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

                    {isCustomSelected && selectedCustomId && (
                      <button
                        title="Remove this custom font"
                        onClick={() => {
                          const newLibrary = fontLibrary.filter(e => e.id !== selectedCustomId)
                          const customId = `custom:${selectedCustomId}`
                          const newFonts = { ...local.visual.fonts }
                          for (const r of FONT_ROLES) {
                            if (newFonts[r] === customId) newFonts[r] = ''
                          }
                          setLocal({ ...local, visual: { ...local.visual, fontLibrary: newLibrary, fonts: newFonts } })
                          setSaved(false)
                        }}
                        className="p-1.5 text-red-400 hover:text-red-600 border border-red-200 rounded hover:bg-red-50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1.5">
                    <label className="text-xs text-gray-400 whitespace-nowrap">Size (px)</label>
                    <input
                      type="number"
                      value={fontSize}
                      min={8}
                      max={200}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0
                        updateVisual('fontSizes', { ...(local.visual.fontSizes ?? { headline: 56, body: 38, cta: 48 }), [fontSizeKey]: val })
                      }}
                      className="w-16 border rounded px-2 py-1 text-sm text-center"
                    />
                  </div>

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
                </div>
              )
            })}
          </div>
        </div>

        {/* Logo, CTA, Handle */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Logo</label>
            {local.visual.logo ? (
              <div className="border rounded p-2 bg-gray-50 space-y-2">
                <img
                  src={`/api/files/${local.visual.logo}`}
                  alt="Logo"
                  className="max-h-16 max-w-full object-contain mx-auto block"
                />
                <button
                  onClick={handleUploadLogo}
                  className="w-full text-xs text-blue-600 hover:underline"
                >
                  Replace logo...
                </button>
              </div>
            ) : (
              <button
                onClick={handleUploadLogo}
                className="w-full border border-dashed rounded py-2 text-sm text-gray-500 hover:bg-gray-50"
              >
                Upload logo...
              </button>
            )}
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

      {/* Content Defaults */}
      <section className="space-y-4">
        <div className="flex items-center gap-1.5">
          <h2 className="text-lg font-semibold">Content Defaults</h2>
          <InfoPopover text="Character limits for AI-generated content. Caption limits apply to the Instagram caption below the post. Body max applies to the text on each individual slide (single or carousel)." />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Caption Min Chars</label>
            <input
              type="number"
              value={local.contentDefaults.captionMinChars}
              min={0}
              onChange={(e) => setLocal({ ...local, contentDefaults: { ...local.contentDefaults, captionMinChars: parseInt(e.target.value) || 0 } })}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Caption Max Chars</label>
            <input
              type="number"
              value={local.contentDefaults.captionMaxChars}
              min={1}
              onChange={(e) => setLocal({ ...local, contentDefaults: { ...local.contentDefaults, captionMaxChars: parseInt(e.target.value) || 1 } })}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Body Max Chars (per slide)</label>
            <input
              type="number"
              value={local.contentDefaults.bodyMaxChars}
              min={1}
              onChange={(e) => setLocal({ ...local, contentDefaults: { ...local.contentDefaults, bodyMaxChars: parseInt(e.target.value) || 1 } })}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-semibold">Content Pillars</h2>
            <InfoPopover text="Pillars define the strategic purpose of your posts. Each pillar represents a goal — awareness, conversion, retention, etc. Set a target percentage and the app tracks your actual posting mix, warning you when you drift off balance." />
          </div>
          <button onClick={addPillar} className="text-sm text-blue-600 hover:underline">+ Add Pillar</button>
        </div>
        {local.pillars.map((p, i) => (
          <div key={p.id} className="space-y-2">
            <div className="flex gap-3 items-center">
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
            <textarea
              value={p.rules ?? ''}
              onChange={(e) => updatePillar(i, 'rules', e.target.value)}
              rows={2}
              className="w-full border rounded px-3 py-2 text-sm resize-none text-gray-600"
              placeholder="Content rules for this pillar (what to include, what to avoid...)"
            />
          </div>
        ))}
      </section>

      {/* Areas */}
      <DimensionListEditor
        title="Areas"
        infoText="Life areas your content covers - the 'what' of each post. Each post is tagged with one area so the app can track coverage and suggest underrepresented topics."
        emptyMessage="No areas configured yet."
        items={local.areas}
        onAdd={() => { setLocal({ ...local, areas: [...local.areas, { id: crypto.randomUUID(), name: '', description: '' }] }); setSaved(false) }}
        onRemove={(id) => {
          setLocal({
            ...local,
            areas: local.areas.filter(a => a.id !== id),
            blacklist: local.blacklist.filter(b => !(b.dimension1 === 'area' && b.value1 === local.areas.find(a => a.id === id)?.name) && !(b.dimension2 === 'area' && b.value2 === local.areas.find(a => a.id === id)?.name))
          })
          setSaved(false)
        }}
        onUpdate={(id, updates) => {
          setLocal({ ...local, areas: local.areas.map(a => a.id === id ? { ...a, ...updates } : a) })
          setSaved(false)
        }}
        renderFields={(item, onUpdate) => (
          <div className="space-y-2">
            <input type="text" value={item.name} onChange={(e) => onUpdate({ name: e.target.value } as any)} className="w-full border rounded px-3 py-2 text-sm" placeholder="Area name (e.g. L1 Familienleben)" />
            <input type="text" value={item.description} onChange={(e) => onUpdate({ description: e.target.value } as any)} className="w-full border rounded px-3 py-2 text-sm text-gray-600" placeholder="Description (optional)" />
          </div>
        )}
      />

      {/* Methods */}
      <DimensionListEditor
        title="Methods"
        infoText="Storytelling methods - how the post is structured. Examples: provocative thesis, Q&A, personal story, listicle, myth-busting. Some methods have format constraints (single-only or carousel-only)."
        emptyMessage="No methods configured yet."
        items={local.methods}
        onAdd={() => { setLocal({ ...local, methods: [...local.methods, { id: crypto.randomUUID(), name: '', description: '' }] }); setSaved(false) }}
        onRemove={(id) => {
          setLocal({
            ...local,
            methods: local.methods.filter(m => m.id !== id),
            blacklist: local.blacklist.filter(b => !(b.dimension1 === 'method' && b.value1 === local.methods.find(m => m.id === id)?.name) && !(b.dimension2 === 'method' && b.value2 === local.methods.find(m => m.id === id)?.name))
          })
          setSaved(false)
        }}
        onUpdate={(id, updates) => {
          setLocal({ ...local, methods: local.methods.map(m => m.id === id ? { ...m, ...updates } : m) })
          setSaved(false)
        }}
        renderFields={(item, onUpdate) => (
          <div className="space-y-2">
            <input type="text" value={item.name} onChange={(e) => onUpdate({ name: e.target.value } as any)} className="w-full border rounded px-3 py-2 text-sm" placeholder="Method name (e.g. M1 Provokante These)" />
            <input type="text" value={item.description} onChange={(e) => onUpdate({ description: e.target.value } as any)} className="w-full border rounded px-3 py-2 text-sm text-gray-600" placeholder="Description (optional)" />
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>Format:</span>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={!item.formatConstraints || item.formatConstraints.length === 0 || item.formatConstraints.includes('single')}
                  onChange={(e) => {
                    const current = item.formatConstraints ?? []
                    let next: string[]
                    if (e.target.checked) {
                      next = current.length === 0 ? [] : [...current, 'single']
                    } else {
                      next = current.filter(f => f !== 'single')
                      if (next.length === 0) next = ['carousel']
                    }
                    onUpdate({ formatConstraints: next.length === 0 || next.length === 2 ? undefined : next } as any)
                  }}
                />
                Single
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={!item.formatConstraints || item.formatConstraints.length === 0 || item.formatConstraints.includes('carousel')}
                  onChange={(e) => {
                    const current = item.formatConstraints ?? []
                    let next: string[]
                    if (e.target.checked) {
                      next = current.length === 0 ? [] : [...current, 'carousel']
                    } else {
                      next = current.filter(f => f !== 'carousel')
                      if (next.length === 0) next = ['single']
                    }
                    onUpdate({ formatConstraints: next.length === 0 || next.length === 2 ? undefined : next } as any)
                  }}
                />
                Carousel
              </label>
            </div>
          </div>
        )}
      />

      {/* Tonalities */}
      <DimensionListEditor
        title="Tonalities"
        infoText="Tone of voice for each post - emotional, humorous, matter-of-fact, or provocative. Tracked for variety across your feed."
        emptyMessage="No tonalities configured yet."
        items={local.tonalities}
        onAdd={() => { setLocal({ ...local, tonalities: [...local.tonalities, { id: crypto.randomUUID(), name: '', description: '' }] }); setSaved(false) }}
        onRemove={(id) => {
          setLocal({
            ...local,
            tonalities: local.tonalities.filter(t => t.id !== id),
            blacklist: local.blacklist.filter(b => !(b.dimension1 === 'tonality' && b.value1 === local.tonalities.find(t => t.id === id)?.name) && !(b.dimension2 === 'tonality' && b.value2 === local.tonalities.find(t => t.id === id)?.name))
          })
          setSaved(false)
        }}
        onUpdate={(id, updates) => {
          setLocal({ ...local, tonalities: local.tonalities.map(t => t.id === id ? { ...t, ...updates } : t) })
          setSaved(false)
        }}
        renderFields={(item, onUpdate) => (
          <div className="space-y-2">
            <input type="text" value={item.name} onChange={(e) => onUpdate({ name: e.target.value } as any)} className="w-full border rounded px-3 py-2 text-sm" placeholder="Tonality name (e.g. T1 Emotional)" />
            <input type="text" value={item.description} onChange={(e) => onUpdate({ description: e.target.value } as any)} className="w-full border rounded px-3 py-2 text-sm text-gray-600" placeholder="Description (optional)" />
          </div>
        )}
      />

      {/* Blacklist */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-semibold">Blacklist</h2>
            <InfoPopover text="Forbidden or discouraged dimension combinations. Hard = blocked in the wizard. Soft = shows a warning but allows selection." />
          </div>
          <button
            onClick={() => {
              setLocal({
                ...local,
                blacklist: [...local.blacklist, { dimension1: 'method', value1: '', dimension2: 'tonality', value2: '', severity: 'hard' }]
              })
              setSaved(false)
            }}
            className="text-sm text-blue-600 hover:underline"
          >+ Add Rule</button>
        </div>
        {local.blacklist.length === 0 && (
          <p className="text-sm text-gray-400">No blacklist rules configured.</p>
        )}
        {local.blacklist.map((entry, i) => {
          const dims = ['area', 'angle', 'method', 'tonality', 'pillar'] as const
          const getValues = (dim: string) => {
            if (dim === 'area') return local.areas.map(a => a.name)
            if (dim === 'angle') return local.pillars.flatMap(p => (p.angles ?? []).map(a => a.name))
            if (dim === 'method') return local.methods.map(m => m.name)
            if (dim === 'tonality') return local.tonalities.map(t => t.name)
            if (dim === 'pillar') return local.pillars.map(p => p.name)
            return []
          }

          return (
            <div key={i} className="flex gap-2 items-center flex-wrap">
              <select value={entry.dimension1} onChange={(e) => {
                const bl = [...local.blacklist]; bl[i] = { ...bl[i], dimension1: e.target.value, value1: '' }; setLocal({ ...local, blacklist: bl }); setSaved(false)
              }} className="border rounded px-2 py-1 text-sm">
                {dims.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={entry.value1} onChange={(e) => {
                const bl = [...local.blacklist]; bl[i] = { ...bl[i], value1: e.target.value }; setLocal({ ...local, blacklist: bl }); setSaved(false)
              }} className="border rounded px-2 py-1 text-sm">
                <option value="">Select...</option>
                {getValues(entry.dimension1).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <span className="text-xs text-gray-400">+</span>
              <select value={entry.dimension2} onChange={(e) => {
                const bl = [...local.blacklist]; bl[i] = { ...bl[i], dimension2: e.target.value, value2: '' }; setLocal({ ...local, blacklist: bl }); setSaved(false)
              }} className="border rounded px-2 py-1 text-sm">
                {dims.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={entry.value2} onChange={(e) => {
                const bl = [...local.blacklist]; bl[i] = { ...bl[i], value2: e.target.value }; setLocal({ ...local, blacklist: bl }); setSaved(false)
              }} className="border rounded px-2 py-1 text-sm">
                <option value="">Select...</option>
                {getValues(entry.dimension2).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <select value={entry.severity} onChange={(e) => {
                const bl = [...local.blacklist]; bl[i] = { ...bl[i], severity: e.target.value as 'hard' | 'soft' }; setLocal({ ...local, blacklist: bl }); setSaved(false)
              }} className="border rounded px-2 py-1 text-sm">
                <option value="hard">Hard</option>
                <option value="soft">Soft</option>
              </select>
              <button onClick={() => { setLocal({ ...local, blacklist: local.blacklist.filter((_, idx) => idx !== i) }); setSaved(false) }} className="text-red-400 hover:text-red-600 text-sm">Remove</button>
            </div>
          )
        })}
      </section>
    </div>
  )
}
