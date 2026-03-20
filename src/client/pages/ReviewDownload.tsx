import { useState } from 'react'
import { useWizardStore } from '../stores/wizardStore'
import { api } from '../lib/apiClient'

interface ReviewDownloadProps {
  onDone: () => void
  onBack: () => void
}

export function ReviewDownload({ onDone, onBack }: ReviewDownloadProps) {
  const { slides, caption, renderedImages, setPostId } = useWizardStore()
  const { selectedPillar, selectedScenario, selectedMethod, contentType, impulse, selectedHookId, selectedCtaId, selectedSituationId, selectedScienceId } = useWizardStore()
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await api.post<{ id: number }>('/posts', {
        post: {
          pillar: selectedPillar,
          scenario: selectedScenario,
          method: selectedMethod,
          content_type: contentType,
          caption,
          slide_count: slides.length,
          impulse: impulse || undefined,
          status: 'approved',
          selectedHookId: selectedHookId || undefined,
          selectedCtaId: selectedCtaId || undefined,
          selectedSituationId: selectedSituationId || undefined,
          selectedScienceId: selectedScienceId || undefined,
        },
        slides: slides.map((s) => ({
          slide_number: s.slide_number,
          slide_type: s.slide_type,
          hook_text: s.hook_text,
          body_text: s.body_text,
          cta_text: s.cta_text,
          overlay_opacity: s.overlay_opacity,
          zone_overrides: s.zone_overrides
        }))
      })
      setPostId(result.id)
      setSaved(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await api.downloadZip({ slides, caption })
    } catch (err) {
      console.error(err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-3 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 flex items-center gap-1"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Review & Download</h1>
        </div>
        <div className="flex gap-3">
          {!saved && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'Saving...' : 'Approve & Save'}
            </button>
          )}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {downloading && <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />}
            {downloading ? 'Downloading...' : 'Download ZIP'}
          </button>
          {saved && (
            <button
              onClick={onDone}
              className="px-5 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Done
            </button>
          )}
        </div>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
          Post saved and balance matrix updated.
        </div>
      )}

      {/* Rendered previews */}
      <div className="grid grid-cols-3 gap-4">
        {renderedImages.map((img) => (
          <div key={img.slide_number} className="border rounded-lg overflow-hidden">
            <img src={img.dataUrl} alt={`Slide ${img.slide_number}`} className="w-full" />
            <div className="px-3 py-1.5 text-xs text-gray-500 text-center">Slide {img.slide_number}</div>
          </div>
        ))}
      </div>

      {/* Caption preview */}
      {caption && (
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Caption</h3>
          <p className="text-sm whitespace-pre-wrap">{caption}</p>
        </div>
      )}
    </div>
  )
}
