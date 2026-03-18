import { useEffect, useRef, useState } from 'react'
import type { Slide, Settings, ZoneOverride, FontLibraryEntry } from '@shared/types'
import { GOOGLE_FONT_NAMES } from '@shared/fonts'

const SLIDE_W = 1080
const SLIDE_H = 1350

interface SlidePreviewProps {
  slide: Slide
  allSlides: Slide[]
  settings: Settings | null
  className?: string
}

function fileUrl(path: string, baseUrl: string): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${baseUrl}/api/files/${encodeURIComponent(path.replace(/\\/g, '/'))}`
}

function resolveFont(
  value: string | undefined,
  alias: string,
  fontLibrary: FontLibraryEntry[],
  baseUrl: string
): { css: string; family: string } {
  if (!value) return { css: '', family: 'sans-serif' }

  if (value.startsWith('custom:')) {
    const id = value.slice(7)
    const entry = fontLibrary.find(f => f.id === id)
    if (entry) {
      return {
        css: `@font-face { font-family: '${alias}'; src: url('${fileUrl(entry.path, baseUrl)}'); }`,
        family: `'${alias}', sans-serif`
      }
    }
    return { css: '', family: 'sans-serif' }
  }

  if (value.includes('/')) {
    return {
      css: `@font-face { font-family: '${alias}'; src: url('${fileUrl(value, baseUrl)}'); }`,
      family: `'${alias}', sans-serif`
    }
  }

  if (GOOGLE_FONT_NAMES.has(value)) {
    const encoded = value.split(' ').join('+')
    return {
      css: `@import url('https://fonts.googleapis.com/css2?family=${encoded}:ital,wght@0,400;0,700;1,400&display=swap');`,
      family: `'${value}', sans-serif`
    }
  }

  return { css: '', family: `'${value}', sans-serif` }
}

export function SlidePreview({ slide, allSlides, settings, className }: SlidePreviewProps) {
  const baseUrl = window.location.origin
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      if (w > 0) setScale(w / SLIDE_W)
    })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  const v = settings?.visual
  const colors = v?.colors ?? ['#ffffff', '#cccccc', '#1a1a2e']
  const primaryColor = colors[0] || '#ffffff'
  const secondaryColor = colors[1] || '#cccccc'
  const bgColor = colors[2] || '#1a1a2e'
  const fontLibrary = v?.fontLibrary ?? []

  const headlineFont = resolveFont(v?.fonts?.headline, 'CustomHeadline', fontLibrary, baseUrl)
  const bodyFont = resolveFont(v?.fonts?.body, 'CustomBody', fontLibrary, baseUrl)
  const ctaFont = resolveFont(v?.fonts?.cta, 'CustomCTA', fontLibrary, baseUrl)

  // Inject font CSS into document head
  useEffect(() => {
    const css = [headlineFont.css, bodyFont.css, ctaFont.css].filter(Boolean).join('\n')
    if (!css) return
    const style = document.createElement('style')
    style.textContent = css
    document.head.appendChild(style)
    return () => style.remove()
  }, [headlineFont.css, bodyFont.css, ctaFont.css])

  const overlayOpacity = slide.overlay_opacity ?? 0.5

  const slideIdx = allSlides.findIndex(s => s.uid === slide.uid)
  const isLast = slideIdx === allSlides.length - 1
  const ctaText = (isLast && slide.slide_type === 'cta' && v?.cta) ? v.cta : (slide.cta_text || '')

  const fontSizes = v?.fontSizes ?? { headline: 56, body: 38, cta: 48 }
  const zoneDefaults = {
    hook: { top: 0, height: 280, font: headlineFont.family, fontSize: fontSizes.headline, color: primaryColor, weight: 'bold' as const },
    body: { top: 280, height: 640, font: bodyFont.family, fontSize: fontSizes.body, color: secondaryColor, weight: 'normal' as const },
    cta:  { top: 920, height: 190, font: ctaFont.family, fontSize: fontSizes.cta, color: primaryColor, weight: 'bold' as const },
  }

  const textMap = { hook: slide.hook_text || '', body: slide.body_text || '', cta: ctaText }
  const overrides = slide.zone_overrides ?? {}

  const bgX = slide.background_position_x ?? 50
  const bgY = slide.background_position_y ?? 50
  const bgScale = slide.background_scale ?? 1.0

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className ?? ''}`}
      style={{ aspectRatio: `${SLIDE_W}/${SLIDE_H}` }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: SLIDE_W,
          height: SLIDE_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          backgroundColor: bgColor,
        }}
      >
        {/* background image layer with pan/zoom */}
        {slide.custom_background_path && (
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url('${fileUrl(slide.custom_background_path, baseUrl)}')`,
              backgroundSize: 'cover',
              backgroundPosition: `${bgX}% ${bgY}%`,
              transform: `scale(${bgScale})`,
              transformOrigin: `${bgX}% ${bgY}%`,
            }} />
          </div>
        )}
        {/* overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(0,0,0,${overlayOpacity})` }} />

        {/* zones */}
        {(['hook', 'body', 'cta'] as const).map(zoneId => {
          const text = textMap[zoneId]
          if (!text) return null
          const def = zoneDefaults[zoneId]
          const ov: ZoneOverride = overrides[zoneId] ?? {}
          return (
            <div
              key={zoneId}
              style={{
                position: 'absolute',
                top: def.top,
                left: 0,
                right: 0,
                height: def.height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '30px 80px',
              }}
            >
              <div
                style={{
                  fontFamily: ov.fontFamily ? `'${ov.fontFamily}'` : def.font,
                  fontSize: ov.fontSize ?? def.fontSize,
                  fontWeight: ov.fontWeight ?? def.weight,
                  color: ov.color ?? def.color,
                  textAlign: ov.textAlign ?? 'center',
                  lineHeight: 1.3,
                  wordWrap: 'break-word',
                  whiteSpace: 'pre-wrap',
                  width: '100%',
                }}
              >
                {text}
              </div>
            </div>
          )
        })}

        {/* logo — above handle, locked in bottom zone */}
        {v?.logo && (
          <img
            src={fileUrl(v.logo, baseUrl)}
            alt=""
            style={{
              position: 'absolute',
              bottom: 90,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 400,
              height: 'auto',
              objectFit: 'contain',
            }}
          />
        )}

        {/* handle — larger, bottom of slide */}
        {v?.handle && (
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: bodyFont.family,
              fontSize: 30,
              color: secondaryColor,
              whiteSpace: 'nowrap',
            }}
          >
            {v.handle}
          </div>
        )}
      </div>
    </div>
  )
}
