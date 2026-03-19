import { useEffect, useRef, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { useSettingsStore } from '../stores/settingsStore'
import { ContextEditor, AutoTextarea } from '../components/ContextEditor'
import { DimensionListEditor } from '../components/DimensionListEditor'
import { ColorPalette } from '../components/ColorPalette'
import { api } from '../lib/apiClient'
import type { Settings, FontLibraryEntry, IgConnectionStatus } from '@shared/types'
import { PRESET_FONTS } from '@shared/fonts'

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

type Section = 'identity' | 'library' | 'design' | 'strategy' | 'tech'

const SECTION_TITLES: Record<Section, { title: string; description: string }> = {
  identity: { title: 'Brand Identity', description: 'Define who your brand is - voice, audience, positioning, and competitive context.' },
  library: { title: 'Creative Library', description: 'Reusable creative assets - situations, hooks, and CTAs that feed into content generation.' },
  design: { title: 'Design', description: 'Visual identity - colors, fonts, logo, and content formatting defaults.' },
  strategy: { title: 'Content Strategy', description: 'Pillars, areas, methods, and tonalities that define your content mix and guide AI generation.' },
  tech: { title: 'Tech', description: 'Instagram connection, API tokens, and technical configuration.' },
}

const identityDocLabels: Record<string, string> = {
  brandVoice: 'Brand Voice',
  targetPersona: 'Target Persona',
  productUVP: 'Product & UVP',
  pov: 'Point of View',
  competitive: 'Competitive Landscape'
}

const FONT_ROLES = ['headline', 'body', 'cta'] as const
type FontRole = typeof FONT_ROLES[number]

interface BrandConfigProps {
  section?: Section
  onBack?: () => void
}

export function BrandConfig({ section = 'identity', onBack }: BrandConfigProps) {
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
    setLocal({ ...local, pillars: [...local.pillars, { id: crypto.randomUUID(), name: '', targetPct: 0, rules: '', angles: [], allowedTonalities: [], allowedMethods: [], allowedAreas: [], areaRequired: true }] })
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
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{SECTION_TITLES[section].title}</h1>
          <p className="text-sm text-gray-500 mt-1">{SECTION_TITLES[section].description}</p>
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

      {/* Section Content */}
      {section === 'identity' && (
        <div className="space-y-6">
          <section className="space-y-4">
            {Object.entries(identityDocLabels).map(([key, label]) => (
              <ContextEditor
                key={key}
                label={label}
                value={local.contextDocs[key as keyof typeof local.contextDocs]}
                onChange={(v) => updateContextDoc(key, v)}
                placeholder={`Describe your ${label.toLowerCase()}...`}
              />
            ))}
          </section>
        </div>
      )}

      {section === 'library' && (
        <div className="space-y-6">
          {/* Hooks - live editor */}
          <section className="space-y-4">
            <ContextEditor
              label="Hooks"
              value={local.contextDocs.hooks}
              onChange={(v) => updateContextDoc('hooks', v)}
              placeholder="List your hook patterns and examples..."
            />
          </section>

          <div className="grid grid-cols-1 gap-4">
            {/* Real Life Situations */}
            <div className="border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-800">Real Life Situations</h3>
                <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">Coming soon</span>
              </div>
              <p className="text-sm text-gray-500">
                A library of real-life moments and situations that anchor your content in authenticity.
                These will feed directly into content generation as situation prompts.
              </p>
            </div>

            {/* CTAs */}
            <div className="border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-800">CTAs</h3>
                <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">Coming soon</span>
              </div>
              <p className="text-sm text-gray-500">
                Call-to-action variants for different post types and goals.
              </p>
            </div>
          </div>
        </div>
      )}

      {section === 'design' && (
        <div className="space-y-8">
          {/* Colors */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Colors</h3>
            <div className="grid grid-cols-3 gap-4">
              {['Primary', 'Secondary', 'Background'].map((label, i) => (
                <BrandColorPicker
                  key={i}
                  label={label}
                  color={local.visual.colors[i] || '#000000'}
                  onChange={(c) => updateColor(i, c)}
                />
              ))}
            </div>
          </section>

          {/* Fonts */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Fonts</h3>
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
          </section>

          {/* Logo & Handle */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Logo & Handle</h3>
            <div className="grid grid-cols-2 gap-4">
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
              <h3 className="text-sm font-semibold text-gray-700">Content Defaults</h3>
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

          {/* Generation Fields */}
          <section className="space-y-4">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-gray-700">Generation Fields</h3>
              <InfoPopover text="Controls which text zones the AI fills per slide type. 'All fields' generates hook, body, and CTA. Other options limit generation to specific zones - the remaining zones stay empty for manual editing." />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {([
                ['single', 'Single Slide'],
                ['carouselCover', 'Carousel Cover'],
                ['carouselContent', 'Carousel Content'],
                ['carouselCta', 'Carousel CTA'],
              ] as const).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <select
                    value={local.contentDefaults.generationFields?.[key] ?? 'all'}
                    onChange={(e) => setLocal({
                      ...local,
                      contentDefaults: {
                        ...local.contentDefaults,
                        generationFields: {
                          ...{ single: 'all', carouselCover: 'all', carouselContent: 'all', carouselCta: 'all' },
                          ...local.contentDefaults.generationFields,
                          [key]: e.target.value,
                        }
                      }
                    })}
                    className="w-full border rounded px-2 py-2 text-sm bg-white"
                  >
                    <option value="all">All fields</option>
                    <option value="hook_body">Hook + Body</option>
                    <option value="body_cta">Body + CTA</option>
                    <option value="body_only">Only Body</option>
                    <option value="hook_only">Only Hook</option>
                  </select>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {section === 'strategy' && (
        <div className="space-y-8">
          {/* Pillars */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold text-gray-700">Content Pillars</h3>
                <InfoPopover text="Pillars define the strategic purpose of your posts. Each pillar represents a goal - awareness, conversion, retention, etc. Set a target percentage and the app tracks your actual posting mix, warning you when you drift off balance." />
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
                <AutoTextarea
                  value={p.rules ?? ''}
                  onChange={(v) => updatePillar(i, 'rules', v)}
                  placeholder="Content rules for this pillar (what to include, what to avoid...)"
                  className="w-full border rounded px-3 py-2 text-sm resize-none overflow-hidden text-gray-600"
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
                areas: local.areas.filter(a => a.id !== id)
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
                methods: local.methods.filter(m => m.id !== id)
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
                tonalities: local.tonalities.filter(t => t.id !== id)
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
        </div>
      )}

      {section === 'tech' && (
        <TechSection />
      )}
    </div>
  )
}

function TechSection() {
  const [status, setStatus] = useState<IgConnectionStatus | null>(null)
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      const data = await api.get<IgConnectionStatus>('/instagram/status')
      setStatus(data)
    } catch {
      setStatus({ connected: false })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStatus() }, [])

  const handleConnect = async () => {
    if (!token.trim()) return
    setConnecting(true)
    setError(null)
    try {
      const result = await api.post<{ connected: boolean; username: string; expires_at: number }>('/instagram/connect', { access_token: token.trim() })
      setStatus({
        connected: true,
        username: result.username,
        expires_at: result.expires_at,
        days_until_expiry: 60,
        expired: false,
        near_expiry: false
      })
      setToken('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await api.delete('/instagram/connect')
      setStatus({ connected: false })
      setToken('')
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  if (loading) return <div className="text-gray-500">Loading...</div>

  const isExpired = status?.expired
  const isNearExpiry = status?.near_expiry
  const showPasteField = !status?.connected || isExpired

  return (
    <div className="space-y-8">
      <div className="border rounded-lg p-6 space-y-4 max-w-lg">
        <h3 className="text-sm font-semibold text-gray-700">Instagram Connection</h3>

        {showPasteField ? (
          <>
            {isExpired && (
              <p className="text-red-500 text-sm">Token expired - please reconnect</p>
            )}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Access Token</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={token}
                  onChange={(e) => { setToken(e.target.value); setError(null) }}
                  disabled={connecting}
                  placeholder="Paste your Instagram access token"
                  className="flex-1 border rounded px-3 py-2 text-sm disabled:opacity-50"
                />
                <button
                  onClick={handleConnect}
                  disabled={connecting || !token.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {connecting && (
                    <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {connecting ? 'Connecting...' : 'Connect'}
                </button>
              </div>
              {error && (
                <p className="text-red-500 text-xs mt-1">{error}</p>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Connected: @{status?.username}</p>
                {isNearExpiry ? (
                  <p className="text-amber-600 text-xs mt-0.5">
                    Token expires in {status?.days_until_expiry} days
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Expires: {status?.expires_at
                      ? new Date(status.expires_at * 1000).toLocaleDateString()
                      : 'Unknown'}
                  </p>
                )}
              </div>
              <button
                onClick={handleDisconnect}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function BrandColorPicker({ label, color, onChange }: { label: string; color: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs text-gray-500 mb-1">{label} Color</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 border rounded px-2 py-1.5 hover:bg-gray-50 w-full"
      >
        <div
          className="w-6 h-6 rounded border border-gray-200 flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-mono text-gray-700">{color}</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
          <ColorPalette
            color={color}
            onChange={(c) => onChange(c)}
          />
        </div>
      )}
    </div>
  )
}
