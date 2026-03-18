import { useEffect, useRef, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { useSettingsStore } from '../stores/settingsStore'
import { ContextEditor } from '../components/ContextEditor'
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
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-semibold">Themes</h2>
            <InfoPopover text="Themes are the topic categories your content covers. The AI picks from this list to keep your feed varied and on-brand. Each post gets tagged with a theme so the app can surface what you've covered recently and suggest what's underrepresented." />
          </div>
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
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-semibold">Mechanics</h2>
            <InfoPopover text="Mechanics are the storytelling formats or structures a post can use — e.g. Before/After, How-to, Myth vs. Reality, Transformation story. They define how you say something, while themes define what you talk about. The AI uses your mechanic library to vary post structure and match the right format to the right goal." />
          </div>
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
