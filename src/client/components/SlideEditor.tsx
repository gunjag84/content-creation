import { useRef, useState } from 'react'
import type { Slide } from '@shared/types'

interface SlideEditorProps {
  slide: Slide
  index: number
  onChange: (index: number, field: keyof Slide, value: string | number) => void
  onUploadBackground: (file: File) => Promise<void>
  onEnterPanMode: () => void
  uploadingBg?: boolean
}

export function SlideEditor({ slide, index, onChange, onUploadBackground, onEnterPanMode, uploadingBg }: SlideEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    try {
      await onUploadBackground(file)
    } catch {
      setUploadError('Upload failed. Try again.')
    }
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">
          Slide {slide.slide_number} - {slide.slide_type}
        </h3>
        <label className="flex items-center gap-2 text-xs text-gray-400">
          Overlay
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={slide.overlay_opacity}
            onChange={(e) => onChange(index, 'overlay_opacity', parseFloat(e.target.value))}
            className="w-20"
          />
          <span>{Math.round(slide.overlay_opacity * 100)}%</span>
        </label>
      </div>

      {(slide.slide_type === 'cover' || slide.slide_type === 'content') && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Hook</label>
          <textarea
            value={slide.hook_text}
            onChange={(e) => onChange(index, 'hook_text', e.target.value)}
            rows={2}
            className="w-full border rounded px-3 py-2 text-sm resize-none"
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Body</label>
        <textarea
          value={slide.body_text}
          onChange={(e) => onChange(index, 'body_text', e.target.value)}
          rows={3}
          className="w-full border rounded px-3 py-2 text-sm resize-none"
        />
      </div>

      {(slide.slide_type === 'cta' || slide.slide_type === 'cover') && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">CTA</label>
          <textarea
            value={slide.cta_text}
            onChange={(e) => onChange(index, 'cta_text', e.target.value)}
            rows={1}
            className="w-full border rounded px-3 py-2 text-sm resize-none"
          />
        </div>
      )}

      {/* Background image */}
      <div className="border-t pt-3">
        <p className="text-xs font-medium text-gray-500 mb-2">Background image</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
        />
        {slide.custom_background_path ? (
          <button
            onClick={onEnterPanMode}
            className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 text-gray-700"
          >
            Reframe
          </button>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingBg}
            className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 text-gray-700 disabled:opacity-50 flex items-center gap-1.5"
          >
            {uploadingBg && <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />}
            {uploadingBg ? 'Uploading...' : 'Upload image'}
          </button>
        )}
        {uploadError && (
          <p className="mt-1 text-xs text-red-600">{uploadError}</p>
        )}
      </div>
    </div>
  )
}
