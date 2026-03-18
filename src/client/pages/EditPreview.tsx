import { useWizardStore } from '../stores/wizardStore'
import { useSettingsStore } from '../stores/settingsStore'
import { SlideEditor } from '../components/SlideEditor'
import { SlidePreview } from '../components/SlidePreview'
import { BackgroundPanEditor } from '../components/BackgroundPanEditor'
import { api } from '../lib/apiClient'
import { useState } from 'react'

interface EditPreviewProps {
  onRender: () => void
  onBack: () => void
}

export function EditPreview({ onRender, onBack }: EditPreviewProps) {
  const { slides, caption, setSlide, setCaption, setRenderedImages, applyBackgroundToAll } = useWizardStore()
  const { settings } = useSettingsStore()
  const [activeSlide, setActiveSlide] = useState(0)
  const [rendering, setRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imagePanMode, setImagePanMode] = useState(false)
  const [uploadingBg, setUploadingBg] = useState(false)

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

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Slide tabs */}
      {slides.length > 1 && (
        <div className="flex gap-1">
          {slides.map((s, i) => (
            <button
              key={s.uid}
              onClick={() => { setActiveSlide(i); setImagePanMode(false) }}
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
            onChange={setSlide}
            onUploadBackground={handleUploadBackground}
            onEnterPanMode={() => setImagePanMode(true)}
            uploadingBg={uploadingBg}
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
              allSlides={slides}
              settings={settings}
              className="max-w-sm"
            />
          )}
        </div>
      </div>
    </div>
  )
}
