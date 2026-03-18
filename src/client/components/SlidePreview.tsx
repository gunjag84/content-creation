import { useMemo, useEffect, useRef, useState } from 'react'
import type { Slide, Settings } from '@shared/types'
import { buildSlideHTML } from '@shared/buildSlideHTML'

interface SlidePreviewProps {
  slide: Slide
  allSlides: Slide[]
  settings: Settings | null
  className?: string
}

export function SlidePreview({ slide, allSlides, settings, className }: SlidePreviewProps) {
  const baseUrl = window.location.origin

  // Compute HTML immediately on slide changes (useMemo for deps tracking)
  const html = useMemo(() => {
    return buildSlideHTML({ slide, allSlides, settings, baseUrl })
  }, [slide, allSlides, settings, baseUrl])

  // Debounce the actual iframe update to 150ms so rapid keystrokes
  // don't cause a visible flash on every character
  const [srcDoc, setSrcDoc] = useState(html)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSrcDoc(html), 150)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [html])

  // Use direct DOM assignment instead of React's attribute update.
  // React's srcDoc prop update doesn't reliably trigger iframe reload in all browsers.
  const iframeRef = useRef<HTMLIFrameElement>(null)
  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = srcDoc
    }
  }, [srcDoc])

  return (
    <div className={`relative ${className ?? ''}`} style={{ aspectRatio: '1080/1350' }}>
      <iframe
        ref={iframeRef}
        sandbox="allow-scripts"
        className="w-full h-full border rounded"
        style={{ pointerEvents: 'none' }}
        title={`Slide ${slide.slide_number}`}
      />
    </div>
  )
}
