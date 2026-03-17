import { useMemo } from 'react'
import type { Slide, Settings } from '@shared/types'
import { buildSlideHTML } from '@shared/buildSlideHTML'

interface SlidePreviewProps {
  slide: Slide
  allSlides: Slide[]
  settings: Settings | null
  className?: string
}

export function SlidePreview({ slide, allSlides, settings, className }: SlidePreviewProps) {
  const html = useMemo(() => {
    const baseUrl = window.location.origin
    return buildSlideHTML({ slide, allSlides, settings, baseUrl })
  }, [slide, allSlides, settings])

  const srcDoc = html

  return (
    <div className={`relative ${className ?? ''}`} style={{ aspectRatio: '1080/1350' }}>
      <iframe
        srcDoc={srcDoc}
        sandbox="allow-scripts"
        className="w-full h-full border rounded"
        style={{ pointerEvents: 'none' }}
        title={`Slide ${slide.slide_number}`}
      />
    </div>
  )
}
