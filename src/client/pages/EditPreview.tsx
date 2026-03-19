import { useCallback, useEffect, useState } from 'react'
import { useWizardStore } from '../stores/wizardStore'
import { useSettingsStore } from '../stores/settingsStore'
import { SlideEditor } from '../components/SlideEditor'
import { SlidePreview } from '../components/SlidePreview'
import { BackgroundPanEditor } from '../components/BackgroundPanEditor'
import { api } from '../lib/apiClient'
import type { ZoneOverride, ImageLibraryEntry } from '@shared/types'

interface EditPreviewProps {
  onRender: () => void
  onBack: () => void
}

export function EditPreview({ onRender, onBack }: EditPreviewProps) {
  const {
    slides, caption, setSlide, setCaption, setRenderedImages,
    applyBackgroundToAll, setZoneOverride, updateZoneOverrideLive,
    resetZonePosition, clearZoneOverrides, applyZoneOverrideToAll, undo, redo
  } = useWizardStore()
  const { settings, save: saveSettings } = useSettingsStore()
  const [activeSlide, setActiveSlide] = useState(0)
  const [activeZoneId, setActiveZoneId] = useState('hook')
  const [rendering, setRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imagePanMode, setImagePanMode] = useState(false)
  const [uploadingBg, setUploadingBg] = useState(false)
  const [draftMsg, setDraftMsg] = useState<string | null>(null)
  const [showDraftModal, setShowDraftModal] = useState(false)

  const DRAFTS_KEY = 'content-creation-drafts'

  interface DraftEntry {
    id: string
    name: string
    slides: Array<{ hook_text: string; body_text: string; cta_text: string }>
    caption: string
    savedAt: string
  }

  function getDrafts(): DraftEntry[] {
    const raw = localStorage.getItem(DRAFTS_KEY)
    return raw ? JSON.parse(raw) : []
  }

  function saveDrafts(drafts: DraftEntry[]) {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts))
  }

  function stripHtml(html: string): string {
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent ?? ''
  }

  const handleSaveDraft = useCallback(() => {
    const drafts = getDrafts()
    const hookPreview = stripHtml(slides[0]?.hook_text ?? '').slice(0, 40) || 'Untitled'
    const entry: DraftEntry = {
      id: crypto.randomUUID(),
      name: hookPreview,
      slides: slides.map(s => ({
        hook_text: s.hook_text,
        body_text: s.body_text,
        cta_text: s.cta_text,
      })),
      caption,
      savedAt: new Date().toISOString(),
    }
    drafts.unshift(entry)
    saveDrafts(drafts)
    setDraftMsg('Draft saved')
    setTimeout(() => setDraftMsg(null), 2000)
  }, [slides, caption])

  const applyDraft = useCallback((draft: DraftEntry) => {
    draft.slides.forEach((d, i) => {
      if (i < slides.length) {
        setSlide(i, 'hook_text', d.hook_text)
        setSlide(i, 'body_text', d.body_text)
        setSlide(i, 'cta_text', d.cta_text)
      }
    })
    setCaption(draft.caption)
    setShowDraftModal(false)
    setDraftMsg('Draft loaded')
    setTimeout(() => setDraftMsg(null), 2000)
  }, [slides.length, setSlide, setCaption])

  const deleteDraft = useCallback((id: string) => {
    const drafts = getDrafts().filter(d => d.id !== id)
    saveDrafts(drafts)
    // Force re-render by toggling modal
    setShowDraftModal(false)
    setTimeout(() => setShowDraftModal(true), 0)
  }, [])

  const handleCopyToClipboard = useCallback(async () => {
    const parts: string[] = []
    slides.forEach((s, i) => {
      parts.push(`--- Slide ${i + 1} (${s.slide_type}) ---`)
      const hook = stripHtml(s.hook_text).trim()
      const body = stripHtml(s.body_text).trim()
      const cta = stripHtml(s.cta_text).trim()
      if (hook) parts.push(`Hook: ${hook}`)
      if (body) parts.push(`Body: ${body}`)
      if (cta) parts.push(`CTA: ${cta}`)
      parts.push('')
    })
    if (caption.trim()) {
      parts.push(`--- Caption ---`)
      parts.push(caption.trim())
    }
    await navigator.clipboard.writeText(parts.join('\n'))
    setDraftMsg('Copied to clipboard')
    setTimeout(() => setDraftMsg(null), 2000)
  }, [slides, caption])

  // Reset active zone when switching slides
  function handleSlideChange(i: number) {
    setActiveSlide(i)
    setActiveZoneId('hook')
    setImagePanMode(false)
  }

  // Ctrl+Z / Ctrl+Y - but only when no Tiptap editor has focus
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!e.ctrlKey && !e.metaKey) return
      // Don't intercept when a Tiptap (contenteditable) has focus
      if (document.activeElement?.getAttribute('contenteditable') === 'true') return

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  const handleRender = async () => {
    setRendering(true)
    setError(null)
    try {
      const result = await api.post<{ images: Array<{ slide_number: number; dataUrl: string }>; caption: string }>('/render', {
        slides,
        caption
      })
      setRenderedImages(result.images)
      onRender()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setRendering(false)
    }
  }

  const handleUploadBackground = async (file: File) => {
    setUploadingBg(true)
    try {
      const result = await api.upload(file)
      setSlide(activeSlide, 'custom_background_path', result.path)
      setImagePanMode(true)
    } finally {
      setUploadingBg(false)
    }
  }

  const handleRemoveBackground = () => {
    setSlide(activeSlide, 'custom_background_path', '')
    setSlide(activeSlide, 'background_position_x', 50)
    setSlide(activeSlide, 'background_position_y', 50)
    setSlide(activeSlide, 'background_scale', 1.0)
    setImagePanMode(false)
  }

  const handleZoneOverrideChange = (zoneId: string, override: ZoneOverride) => {
    setZoneOverride(activeSlide, zoneId, override)
  }

  const handleResetZonePosition = (zoneId: string) => {
    resetZonePosition(activeSlide, zoneId)
  }

  const handleResetZoneOverrides = (zoneId: string) => {
    clearZoneOverrides(activeSlide, zoneId)
    // Also strip inline TipTap marks (color, font-family, font-size) from the HTML
    // so the zone-level brand defaults fully take over.
    const textFieldMap: Record<string, keyof typeof slides[number]> = {
      hook: 'hook_text', body: 'body_text', cta: 'cta_text',
    }
    const field = textFieldMap[zoneId]
    if (field) {
      const html = (slides[activeSlide]?.[field] as string) ?? ''
      const stripped = html
        .replace(/style="[^"]*"/g, '')  // remove all inline style attrs
      if (stripped !== html) {
        setSlide(activeSlide, field, stripped)
      }
    }
  }

  const handleApplyToAll = (zoneId: string, override: ZoneOverride) => {
    applyZoneOverrideToAll(zoneId, override)
  }

  const handleSaveToLibrary = async () => {
    const slide = slides[activeSlide]
    if (!slide.custom_background_path || !settings) return
    const existingLibrary = settings.visual.imageLibrary ?? []
    const entry: ImageLibraryEntry = {
      id: crypto.randomUUID(),
      path: slide.custom_background_path,
      name: `Image ${existingLibrary.length + 1}`,
      preset: {
        overlay_opacity: slide.overlay_opacity,
        overlay_color: slide.overlay_color,
      },
    }
    await saveSettings({
      ...settings,
      visual: {
        ...settings.visual,
        imageLibrary: [...existingLibrary, entry],
      },
    })
  }

  const handleSelectFromLibrary = (entry: ImageLibraryEntry) => {
    setSlide(activeSlide, 'custom_background_path', entry.path)
    if (entry.preset?.overlay_opacity !== undefined) {
      setSlide(activeSlide, 'overlay_opacity', entry.preset.overlay_opacity)
    }
    if (entry.preset?.overlay_color) {
      setSlide(activeSlide, 'overlay_color', entry.preset.overlay_color)
    }
    setImagePanMode(true)
  }

  const handleDeleteFromLibrary = async (id: string) => {
    if (!settings) return
    await saveSettings({
      ...settings,
      visual: {
        ...settings.visual,
        imageLibrary: (settings.visual.imageLibrary ?? []).filter(e => e.id !== id),
      },
    })
  }

  const handleZoneDragLive = (zoneId: string, override: ZoneOverride) => {
    updateZoneOverrideLive(activeSlide, zoneId, override)
  }

  const handleZoneDragCommit = (zoneId: string, override: ZoneOverride) => {
    setZoneOverride(activeSlide, zoneId, override)
  }

  if (slides.length === 0) {
    return (
      <div className="p-4 space-y-3">
        <p className="text-gray-500">No slides to edit.</p>
        <button onClick={onBack} className="text-sm text-blue-600 hover:underline">Back</button>
      </div>
    )
  }

  const currentSlide = slides[activeSlide]
  const baseUrl = window.location.origin

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-3 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 flex items-center gap-1"
          >
            Back
          </button>
          <h1 className="text-2xl font-bold">Edit & Preview</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            title="Undo (Ctrl+Z)"
            className="px-2 py-2 text-sm text-gray-500 border rounded-lg hover:bg-gray-50"
          >
            ↩
          </button>
          <button
            onClick={redo}
            title="Redo (Ctrl+Y)"
            className="px-2 py-2 text-sm text-gray-500 border rounded-lg hover:bg-gray-50"
          >
            ↪
          </button>
          <div className="w-px h-6 bg-gray-200" />
          <button
            onClick={handleSaveDraft}
            title="Save texts as draft"
            className="px-3 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
          >
            Save Draft
          </button>
          <button
            onClick={() => setShowDraftModal(true)}
            title="Load saved draft"
            className="px-3 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
          >
            Load Draft
          </button>
          <button
            onClick={handleCopyToClipboard}
            title="Copy all texts and caption to clipboard"
            className="px-3 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
          >
            Copy Text
          </button>
          <div className="w-px h-6 bg-gray-200" />
          <button
            onClick={handleRender}
            disabled={rendering}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {rendering && (
              <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
            )}
            {rendering ? 'Rendering...' : 'Render PNGs'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}

      {draftMsg && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-sm text-green-700 text-center">{draftMsg}</div>
      )}

      {/* Slide tabs */}
      {slides.length > 1 && (
        <div className="flex gap-1">
          {slides.map((s, i) => (
            <button
              key={s.uid}
              onClick={() => handleSlideChange(i)}
              className={`px-3 py-1.5 rounded text-sm ${
                i === activeSlide ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Slide {i + 1}.
            </button>
          ))}
        </div>
      )}

      {/* Editor + Preview/Pan side by side */}
      <div className="grid grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <SlideEditor
            slide={currentSlide}
            index={activeSlide}
            settings={settings}
            onChange={setSlide}
            onUploadBackground={handleUploadBackground}
            onEnterPanMode={() => setImagePanMode(true)}
            uploadingBg={uploadingBg}
            activeZoneId={activeZoneId}
            onActiveZoneChange={setActiveZoneId}
            onZoneOverrideChange={handleZoneOverrideChange}
            onResetZoneOverrides={handleResetZoneOverrides}
            onApplyToAll={handleApplyToAll}
            onSaveToLibrary={handleSaveToLibrary}
            onSelectFromLibrary={handleSelectFromLibrary}
            onDeleteFromLibrary={handleDeleteFromLibrary}
          />

          {/* Caption editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Caption <span className={`font-normal ${caption.length < (settings?.contentDefaults?.captionMinChars ?? 50) || caption.length > (settings?.contentDefaults?.captionMaxChars ?? 400) ? 'text-red-500' : 'text-gray-400'}`}>({caption.length} / {settings?.contentDefaults?.captionMinChars ?? 50}-{settings?.contentDefaults?.captionMaxChars ?? 400} chars)</span>
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={5}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-y"
              placeholder="Write your caption..."
            />
          </div>
        </div>

        <div>
          {imagePanMode ? (
            <BackgroundPanEditor
              slide={currentSlide}
              slideIndex={activeSlide}
              totalSlides={slides.length}
              onChange={setSlide}
              onApplyToAll={() => applyBackgroundToAll(activeSlide)}
              onDone={() => setImagePanMode(false)}
              onUpload={handleUploadBackground}
              onRemove={handleRemoveBackground}
              baseUrl={baseUrl}
            />
          ) : (
            <SlidePreview
              slide={currentSlide}
              settings={settings}
              className="max-w-sm"
              isCarousel={slides.length > 1}
              activeZoneId={activeZoneId}
              onZoneDragLive={handleZoneDragLive}
              onZoneDragCommit={handleZoneDragCommit}
            />
          )}
        </div>
      </div>

      {/* Draft modal */}
      {showDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowDraftModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-lg font-semibold">Saved Drafts</h2>
              <button onClick={() => setShowDraftModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {getDrafts().length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">No drafts saved yet.</p>
              ) : (
                <div className="space-y-2">
                  {getDrafts().map(draft => (
                    <div key={draft.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{draft.name}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(draft.savedAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          {' - '}{draft.slides.length} slide{draft.slides.length > 1 ? 's' : ''}
                        </p>
                        {draft.caption && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{draft.caption.slice(0, 100)}{draft.caption.length > 100 ? '...' : ''}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => applyDraft(draft)}
                          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteDraft(draft.id)}
                          className="px-2 py-1.5 text-xs text-red-500 border border-red-200 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
