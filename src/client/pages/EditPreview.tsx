import { useWizardStore } from '../stores/wizardStore'
import { useSettingsStore } from '../stores/settingsStore'
import { SlideEditor } from '../components/SlideEditor'
import { SlidePreview } from '../components/SlidePreview'
import { api } from '../lib/apiClient'
import { useState } from 'react'
import type { Slide } from '@shared/types'

interface EditPreviewProps {
  onRender: () => void
}

export function EditPreview({ onRender }: EditPreviewProps) {
  const { slides, caption, setSlide, setCaption, setRenderedImages } = useWizardStore()
  const { settings } = useSettingsStore()
  const [activeSlide, setActiveSlide] = useState(0)
  const [rendering, setRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  if (slides.length === 0) {
    return <div className="p-4 text-gray-500">No slides to edit. Go back to Create Post.</div>
  }

  const currentSlide = slides[activeSlide]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit & Preview</h1>
        <button
          onClick={handleRender}
          disabled={rendering}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50"
        >
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
              onClick={() => setActiveSlide(i)}
              className={`px-3 py-1.5 rounded text-sm ${
                i === activeSlide ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {i + 1}. {s.slide_type}
            </button>
          ))}
        </div>
      )}

      {/* Editor + Preview side by side */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <SlideEditor
            slide={currentSlide}
            index={activeSlide}
            onChange={setSlide}
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
          <SlidePreview
            slide={currentSlide}
            allSlides={slides}
            settings={settings}
            className="max-w-sm"
          />
        </div>
      </div>
    </div>
  )
}
