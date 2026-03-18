import { useEffect, useRef, useState } from 'react'
import type { Slide, Settings, ZoneOverride } from '@shared/types'
import { resolveFont, fileUrl } from '@shared/fontResolver'
import { ZONE_POSITION_DEFAULTS } from '@shared/zoneDefaults'
import { GOOGLE_FONT_NAMES, googleFontImport } from '@shared/fonts'

const SLIDE_W = 1080
const SLIDE_H = 1350
const MIN_ZONE_W = 100
const MIN_ZONE_H = 60

interface SlidePreviewProps {
  slide: Slide
  settings: Settings | null
  className?: string
  // Drag mode (edit context)
  activeZoneId?: string
  onZoneDragLive?: (zoneId: string, override: ZoneOverride) => void
  onZoneDragCommit?: (zoneId: string, override: ZoneOverride) => void
}

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se'

const RESIZE_HANDLES: { dir: ResizeDir; style: React.CSSProperties }[] = [
  { dir: 'nw', style: { top: -4, left: -4, cursor: 'nw-resize' } },
  { dir: 'n',  style: { top: -4, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' } },
  { dir: 'ne', style: { top: -4, right: -4, cursor: 'ne-resize' } },
  { dir: 'e',  style: { top: '50%', right: -4, transform: 'translateY(-50%)', cursor: 'e-resize' } },
  { dir: 'se', style: { bottom: -4, right: -4, cursor: 'se-resize' } },
  { dir: 's',  style: { bottom: -4, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' } },
  { dir: 'sw', style: { bottom: -4, left: -4, cursor: 'sw-resize' } },
  { dir: 'w',  style: { top: '50%', left: -4, transform: 'translateY(-50%)', cursor: 'w-resize' } },
]

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val))
}

function getZoneRect(def: { top: number; height: number }, ov: ZoneOverride) {
  return {
    top: ov.posTop ?? def.top,
    left: ov.posLeft ?? 0,
    width: ov.posWidth ?? SLIDE_W,
    height: ov.posHeight ?? def.height,
  }
}

export function SlidePreview({ slide, settings, className, activeZoneId, onZoneDragLive, onZoneDragCommit }: SlidePreviewProps) {
  const baseUrl = window.location.origin
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const dragState = useRef<{
    zoneId: string
    startX: number
    startY: number
    startTop: number
    startLeft: number
    startWidth: number
    startHeight: number
    mode: 'drag' | ResizeDir
    currentOverride: ZoneOverride
  } | null>(null)

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

  const customLibraryFontCss = fontLibrary.map(entry =>
    `@font-face { font-family: '${entry.name}'; src: url('${fileUrl(entry.path, baseUrl)}'); }`
  ).join('\n')

  // Collect all font families needed in this slide (zone overrides + TipTap inline styles)
  const neededZoneFonts = new Set<string>()
  const zoneOverrides = slide.zone_overrides ?? {}
  Object.values(zoneOverrides).forEach(ov => { if (ov?.fontFamily) neededZoneFonts.add(ov.fontFamily) })
  // Also scan inline font-family from TipTap HTML content
  const inlineFontRegex = /font-family:\s*['"]?([^;'"<]+?)['"]?\s*[;'"]?(?=;|<)/g
  ;[slide.hook_text, slide.body_text, slide.cta_text].forEach(html => {
    if (!html) return
    let m: RegExpExecArray | null
    while ((m = inlineFontRegex.exec(html)) !== null) {
      neededZoneFonts.add(m[1].trim())
    }
  })
  const customFontNames = new Set(fontLibrary.map(f => f.name))
  const zoneFontCss = [...neededZoneFonts]
    .filter(f => GOOGLE_FONT_NAMES.has(f) && !customFontNames.has(f))
    .map(f => googleFontImport(f))
    .join('\n')

  useEffect(() => {
    const css = [headlineFont.css, bodyFont.css, ctaFont.css, customLibraryFontCss, zoneFontCss].filter(Boolean).join('\n')
    if (!css) return
    const style = document.createElement('style')
    style.textContent = css
    document.head.appendChild(style)
    return () => style.remove()
  }, [headlineFont.css, bodyFont.css, ctaFont.css, customLibraryFontCss, zoneFontCss])

  const overlayOpacity = slide.overlay_opacity ?? 0.5
  const overlayColor = slide.overlay_color === 'light' ? '255,255,255' : '0,0,0'

  const ctaText = slide.cta_text || ''

  const fontSizes = v?.fontSizes ?? { headline: 56, body: 38, cta: 48 }
  const zoneDefaults = {
    hook: { ...ZONE_POSITION_DEFAULTS.hook, font: headlineFont.family, fontSize: fontSizes.headline, color: primaryColor, weight: 'bold' as const },
    body: { ...ZONE_POSITION_DEFAULTS.body, font: bodyFont.family, fontSize: fontSizes.body, color: secondaryColor, weight: 'normal' as const },
    cta:  { ...ZONE_POSITION_DEFAULTS.cta,  font: ctaFont.family,  fontSize: fontSizes.cta,  color: primaryColor, weight: 'bold' as const },
  }

  const textMap = { hook: slide.hook_text || '', body: slide.body_text || '', cta: ctaText }
  const overrides = slide.zone_overrides ?? {}

  const bgX = slide.background_position_x ?? 50
  const bgY = slide.background_position_y ?? 50
  const bgScale = slide.background_scale ?? 1.0

  const isDraggable = !!(onZoneDragLive || onZoneDragCommit)

  // Pointer handlers for drag + resize
  function handlePointerDown(e: React.PointerEvent, zoneId: string, mode: 'drag' | ResizeDir) {
    if (!isDraggable) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    setSelectedZoneId(zoneId)

    const def = zoneDefaults[zoneId as keyof typeof zoneDefaults]
    const ov = overrides[zoneId] ?? {}
    const rect = getZoneRect(def, ov)

    dragState.current = {
      zoneId,
      startX: e.clientX,
      startY: e.clientY,
      startTop: rect.top,
      startLeft: rect.left,
      startWidth: rect.width,
      startHeight: rect.height,
      mode,
      currentOverride: { ...ov }
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragState.current || !onZoneDragLive) return
    const ds = dragState.current
    const dx = (e.clientX - ds.startX) / scale
    const dy = (e.clientY - ds.startY) / scale
    const ov = ds.currentOverride

    let newTop = ds.startTop
    let newLeft = ds.startLeft
    let newWidth = ds.startWidth
    let newHeight = ds.startHeight

    if (ds.mode === 'drag') {
      newTop = clamp(ds.startTop + dy, 0, SLIDE_H - ds.startHeight)
      newLeft = clamp(ds.startLeft + dx, 0, SLIDE_W - ds.startWidth)
    } else {
      // Resize
      const dir = ds.mode
      if (dir.includes('s')) newHeight = Math.max(MIN_ZONE_H, ds.startHeight + dy)
      if (dir.includes('n')) {
        const delta = Math.min(dy, ds.startHeight - MIN_ZONE_H)
        newTop = ds.startTop + delta
        newHeight = ds.startHeight - delta
      }
      if (dir.includes('e')) newWidth = Math.max(MIN_ZONE_W, ds.startWidth + dx)
      if (dir.includes('w')) {
        const delta = Math.min(dx, ds.startWidth - MIN_ZONE_W)
        newLeft = ds.startLeft + delta
        newWidth = ds.startWidth - delta
      }
      // Clamp to canvas bounds
      newTop = clamp(newTop, 0, SLIDE_H - MIN_ZONE_H)
      newLeft = clamp(newLeft, 0, SLIDE_W - MIN_ZONE_W)
      newWidth = clamp(newWidth, MIN_ZONE_W, SLIDE_W - newLeft)
      newHeight = clamp(newHeight, MIN_ZONE_H, SLIDE_H - newTop)
    }

    const liveOverride: ZoneOverride = { ...ov, posTop: newTop, posLeft: newLeft, posWidth: newWidth, posHeight: newHeight }
    ds.currentOverride = liveOverride
    onZoneDragLive(ds.zoneId, liveOverride)
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!dragState.current) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    if (onZoneDragCommit) {
      onZoneDragCommit(dragState.current.zoneId, dragState.current.currentOverride)
    }
    dragState.current = null
  }

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
        <div style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(${overlayColor},${overlayOpacity})` }} />

        {/* zones */}
        {(['hook', 'body', 'cta'] as const).map(zoneId => {
          const text = textMap[zoneId]
          if (!text) return null
          const def = zoneDefaults[zoneId]
          const ov: ZoneOverride = overrides[zoneId] ?? {}
          const rect = getZoneRect(def, ov)

          const isActive = activeZoneId === zoneId || selectedZoneId === zoneId
          const showHandles = isDraggable && selectedZoneId === zoneId

          const zoneStyle: React.CSSProperties = {
            position: 'absolute',
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '30px 80px',
            boxSizing: 'border-box',
            ...(isActive && isDraggable ? { outline: '2px solid hsl(217 91% 60%)', outlineOffset: 0 } : {}),
            ...(isDraggable ? { cursor: showHandles ? 'grab' : 'pointer' } : {}),
          }

          const textStyle: React.CSSProperties = {
            fontFamily: ov.fontFamily ? `'${ov.fontFamily}'` : def.font,
            fontSize: ov.fontSize ?? def.fontSize,
            fontWeight: ov.fontWeight ?? def.weight,
            fontStyle: ov.fontStyle ?? 'normal',
            color: ov.color ?? def.color,
            textAlign: ov.textAlign ?? 'center',
            lineHeight: ov.lineHeight ?? 1.3,
            letterSpacing: ov.letterSpacing ? `${ov.letterSpacing}px` : undefined,
            wordWrap: 'break-word',
            width: '100%',
          }

          return (
            <div
              key={zoneId}
              style={zoneStyle}
              aria-label={isDraggable ? 'Drag to reposition zone' : undefined}
              onPointerDown={isDraggable ? (e) => handlePointerDown(e, zoneId, 'drag') : undefined}
              onPointerMove={isDraggable ? handlePointerMove : undefined}
              onPointerUp={isDraggable ? handlePointerUp : undefined}
              onClick={isDraggable ? (e) => { e.stopPropagation(); setSelectedZoneId(zoneId) } : undefined}
            >
              <div
                style={textStyle}
                dangerouslySetInnerHTML={{ __html: text }}
              />

              {/* Drag handle indicator */}
              {isDraggable && (
                <div style={{ position: 'absolute', top: 8, left: 8, color: 'rgba(255,255,255,0.4)', fontSize: 16, lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>
                  ⠿
                </div>
              )}

              {/* Resize handles */}
              {showHandles && RESIZE_HANDLES.map(({ dir, style }) => (
                <div
                  key={dir}
                  aria-label={`Resize ${dir}`}
                  style={{
                    position: 'absolute',
                    width: 8,
                    height: 8,
                    backgroundColor: 'hsl(217 91% 60%)',
                    border: '1px solid white',
                    borderRadius: 2,
                    ...style,
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    handlePointerDown(e, zoneId, dir)
                  }}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                />
              ))}
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

