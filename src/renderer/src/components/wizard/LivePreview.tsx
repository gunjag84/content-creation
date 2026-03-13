import type { Slide } from '../../../../shared/types/generation'

interface LivePreviewProps {
  slide: Slide
  templateHtml?: string
}

export function LivePreview({ slide, templateHtml }: LivePreviewProps) {
  // If template HTML provided, inject slide text into zones
  if (templateHtml) {
    // Parse the template HTML and replace zone content
    const parser = new DOMParser()
    const doc = parser.parseFromString(templateHtml, 'text/html')

    // Find zones by data-role attributes
    const hookZone = doc.querySelector('[data-role="hook"]')
    const bodyZone = doc.querySelector('[data-role="body"]')
    const ctaZone = doc.querySelector('[data-role="cta"]')

    // Replace text content
    if (hookZone) hookZone.textContent = slide.hook_text || ''
    if (bodyZone) bodyZone.textContent = slide.body_text || ''
    if (ctaZone) ctaZone.textContent = slide.cta_text || ''

    // Serialize back to HTML
    const injectedHtml = doc.documentElement.outerHTML

    return (
      <div className="flex h-full items-start justify-center overflow-auto bg-slate-950 p-4">
        <div className="origin-top-left" style={{ transform: 'scale(0.3)' }}>
          <div dangerouslySetInnerHTML={{ __html: injectedHtml }} />
        </div>
      </div>
    )
  }

  // Fallback: simple branded card preview
  return (
    <div className="flex h-full items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md space-y-4 rounded-lg border border-slate-700 bg-slate-800 p-6">
        {/* Slide Type Badge */}
        <div className="flex items-center gap-2">
          <div className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white">
            {slide.slide_type.toUpperCase()}
          </div>
          <div className="text-xs text-slate-500">Slide {slide.slide_number}</div>
        </div>

        {/* Hook */}
        {slide.hook_text && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-500">HOOK</div>
            <div className="text-lg font-bold text-slate-100">{slide.hook_text}</div>
          </div>
        )}

        {/* Body */}
        {slide.body_text && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-500">BODY</div>
            <div className="text-sm text-slate-300">{slide.body_text}</div>
          </div>
        )}

        {/* CTA */}
        {slide.cta_text && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-500">CTA</div>
            <div className="text-sm font-medium text-blue-400">{slide.cta_text}</div>
          </div>
        )}

        {/* Empty State */}
        {!slide.hook_text && !slide.body_text && !slide.cta_text && (
          <div className="py-8 text-center text-sm text-slate-500">
            Fill in content to see preview
          </div>
        )}

        {/* Note */}
        <div className="border-t border-slate-700 pt-4 text-xs text-slate-500">
          Preview is approximate - final PNG rendered in Step 4
        </div>
      </div>
    </div>
  )
}
