import { useEffect, useState } from 'react'
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
    resetZonePosition, applyZoneOverrideToAll, undo, redo
  } = useWizardStore()
  const { settings, save: saveSettings } = useSettingsStore()
  const [activeSlide, setActiveSlide] = useState(0)
  const [activeZoneId, setActiveZoneId] = useState('hook')
  const [rendering, setRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imagePanMode, setImagePanMode] = useState(false)
  const [uploadingBg, setUploadingBg] = useState(false)

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
            onResetZonePosition={handleResetZonePosition}
            onApplyToAll={handleApplyToAll}
            onSaveToLibrary={handleSaveToLibrary}
            onSelectFromLibrary={handleSelectFromLibrary}
            onDeleteFromLibrary={handleDeleteFromLibrary}
          />

          {/* Caption editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Caption <span className="text-gray-400 font-normal">({caption.length} chars)</span>
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
              activeZoneId={activeZoneId}
              onZoneDragLive={handleZoneDragLive}
              onZoneDragCommit={handleZoneDragCommit}
            />
          )}
        </div>
      </div>
    </div>
  )
}
