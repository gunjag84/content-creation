import type { Slide } from '@shared/types'

interface SlideEditorProps {
  slide: Slide
  index: number
  onChange: (index: number, field: keyof Slide, value: string | number) => void
}

export function SlideEditor({ slide, index, onChange }: SlideEditorProps) {
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
    </div>
  )
}
