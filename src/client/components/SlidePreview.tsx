import { useMemo, useEffect, useRef, useState } from 'react'
import type { Slide, Settings } from '@shared/types'
import { buildSlideHTML } from '@shared/buildSlideHTML'

const SLIDE_W = 1080
const SLIDE_H = 1350

interface SlidePreviewProps {
  slide: Slide
  allSlides: Slide[]
  settings: Settings | null
  className?: string
}

export function SlidePreview({ slide, allSlides, settings, className }: SlidePreviewProps) {
  const baseUrl = window.location.origin

  const html = useMemo(() => {
    return buildSlideHTML({ slide, allSlides, settings, baseUrl })
  }, [slide, allSlides, settings, baseUrl])

  // Scale the 1080×1350 iframe down to fit the container width
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / SLIDE_W)
    })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    // setAttribute triggers the HTML spec's navigate-on-content-attribute-set algorithm.
    // If same value (StrictMode double-invoke), clear first then re-set.
    if (iframe.getAttribute('srcdoc') === html) {
      iframe.removeAttribute('srcdoc')
      requestAnimationFrame(() => {
        if (iframeRef.current) iframeRef.current.setAttribute('srcdoc', html)
      })
    } else {
      iframe.setAttribute('srcdoc', html)
    }
  }, [html])

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className ?? ''}`}
      style={{ aspectRatio: `${SLIDE_W}/${SLIDE_H}` }}
    >
      <iframe
        ref={iframeRef}
        sandbox="allow-scripts"
        className="absolute top-0 left-0 border-0 rounded"
        style={{
          width: SLIDE_W,
          height: SLIDE_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          pointerEvents: 'none',
        }}
        title={`Slide ${slide.slide_number}`}
      />
    </div>
  )
}
