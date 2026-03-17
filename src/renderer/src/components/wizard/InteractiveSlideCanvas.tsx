import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Stage, Layer, Rect, Transformer, Image as KonvaImage, Text as KonvaText } from 'react-konva'
import { CANVAS_WIDTH, CANVAS_HEIGHT_FEED, MIN_ZONE_SIZE, ZONE_STYLES } from '../../lib/canvasConstants'
import { loadCustomFonts } from '../../lib/loadCustomFonts'
import { useCreatePostStore } from '../../stores/useCreatePostStore'
import type { Slide } from '../../../../shared/types/generation'
import type { Zone } from '../templates/ZoneEditor'
import type { Settings } from '../../../../shared/types/settings'

// Minimal template type to avoid importing from preload
interface TemplateInfo {
  background_type: string
  background_value: string
  overlay_color?: string
  overlay_enabled?: boolean
}

interface InteractiveSlideCanvasProps {
  slide: Slide
  slideIndex: number
  zones: Zone[]
  template: TemplateInfo | null
  settings: Settings | null
  bgDataUrl?: string
  customBackgroundPath: string | null
  selectedZoneId: string | null
  onSelectZone: (zoneId: string | null) => void
}

export function InteractiveSlideCanvas({
  slide,
  slideIndex,
  zones,
  template,
  settings,
  bgDataUrl,
  customBackgroundPath,
  selectedZoneId,
  onSelectZone
}: InteractiveSlideCanvasProps) {
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null)
  const [backgroundImg, setBackgroundImg] = useState<HTMLImageElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const transformerRef = useRef<any>(null)
  const stageRef = useRef<any>(null)
  const { setZoneOverride } = useCreatePostStore()

  const canvasHeight = CANVAS_HEIGHT_FEED // Feed format for now
  const scale = containerSize ? containerSize.width / CANVAS_WIDTH : 1

  // Load custom fonts for Konva rendering
  useEffect(() => {
    loadCustomFonts(settings)
  }, [settings])

  // Responsive canvas sizing
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        const width = entry.contentRect.width
        const scaleByWidth = width / CANVAS_WIDTH
        const height = canvasHeight * scaleByWidth
        setContainerSize({ width, height })
      }
    })

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [canvasHeight])

  // Load background image
  useEffect(() => {
    const loadBg = async () => {
      let imgSrc: string | null = null

      if (bgDataUrl) {
        imgSrc = bgDataUrl
      } else if (customBackgroundPath) {
        try {
          imgSrc = await window.api.readFileAsDataUrl(customBackgroundPath)
        } catch { /* ignore */ }
      } else if (template?.background_type === 'image' && template.background_value) {
        try {
          imgSrc = await window.api.readFileAsDataUrl(template.background_value)
        } catch { /* ignore */ }
      }

      if (imgSrc) {
        const img = new Image()
        img.onload = () => setBackgroundImg(img)
        img.onerror = () => setBackgroundImg(null)
        img.src = imgSrc
      } else {
        setBackgroundImg(null)
      }
    }
    loadBg()
  }, [bgDataUrl, customBackgroundPath, template])

  // Update transformer when selection changes
  useEffect(() => {
    if (transformerRef.current && selectedZoneId) {
      const stage = stageRef.current
      if (!stage) return
      const node = stage.findOne(`#slide-zone-${selectedZoneId}`)
      if (node) {
        transformerRef.current.nodes([node])
        transformerRef.current.getLayer().batchDraw()
      }
    }
  }, [selectedZoneId])

  const handleStageClick = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage()
    if (clickedOnEmpty) {
      onSelectZone(null)
      return
    }

    const clickedId = e.target.id().replace('slide-zone-', '')
    if (clickedId && zones.some((z) => z.id === clickedId)) {
      onSelectZone(clickedId)
    }
  }

  const handleDragEnd = (zoneId: string, e: any) => {
    const node = e.target
    const zone = zones.find(z => z.id === zoneId)
    if (!zone) return

    const newX = Math.max(0, Math.min(node.x() / scale, CANVAS_WIDTH - (zone.width)))
    const newY = Math.max(0, Math.min(node.y() / scale, canvasHeight - (zone.height)))

    setZoneOverride(slideIndex, zoneId, { x: newX, y: newY })
  }

  const handleTransformEnd = (zoneId: string, e: any) => {
    const node = e.target
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)

    setZoneOverride(slideIndex, zoneId, {
      x: Math.max(0, node.x() / scale),
      y: Math.max(0, node.y() / scale),
      width: Math.max(MIN_ZONE_SIZE, node.width() * scaleX),
      height: Math.max(MIN_ZONE_SIZE, node.height() * scaleY)
    })
  }

  // Resolve background
  const bgType = template?.background_type || 'solid_color'
  const bgValue = template?.background_value || settings?.visualGuidance?.backgroundColor || '#1a1a2e'
  const overlayColor = template?.overlay_color || '#000000'
  const overlayEnabled = template?.overlay_enabled ?? true
  const overlayOpacity = slide.overlay_opacity ?? 0.5

  const guidance = settings?.visualGuidance
  const primaryColor = guidance?.primaryColor || '#ffffff'
  const secondaryColor = guidance?.secondaryColor || '#cccccc'

  const textZones = zones.filter(z => z.type !== 'no-text')

  return (
    <div ref={containerRef} className="w-full h-full">
      {containerSize && (
        <div
          className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900 mx-auto"
          style={{ width: containerSize.width, height: containerSize.height }}
        >
          <Stage
            ref={stageRef}
            width={containerSize.width}
            height={containerSize.height}
            onMouseDown={handleStageClick}
          >
            <Layer>
              {/* Background */}
              {backgroundImg ? (
                <KonvaImage
                  image={backgroundImg}
                  width={CANVAS_WIDTH * scale}
                  height={canvasHeight * scale}
                  listening={false}
                />
              ) : bgType === 'solid_color' ? (
                <Rect
                  width={CANVAS_WIDTH * scale}
                  height={canvasHeight * scale}
                  fill={bgValue}
                  listening={false}
                />
              ) : bgType === 'gradient' && bgValue ? (() => {
                const parts = bgValue.split(',')
                const color1 = parts[0] || '#000000'
                const color2 = parts[1] || '#ffffff'
                const direction = parts[2] || 'vertical'
                const w = CANVAS_WIDTH * scale
                const h = canvasHeight * scale
                let startPoint = { x: 0, y: 0 }
                let endPoint = { x: 0, y: h }
                if (direction === 'horizontal') endPoint = { x: w, y: 0 }
                else if (direction === 'diagonal') endPoint = { x: w, y: h }
                return (
                  <Rect
                    width={w}
                    height={h}
                    fillLinearGradientStartPoint={startPoint}
                    fillLinearGradientEndPoint={endPoint}
                    fillLinearGradientColorStops={[0, color1, 1, color2]}
                    listening={false}
                  />
                )
              })() : (
                <Rect
                  width={CANVAS_WIDTH * scale}
                  height={canvasHeight * scale}
                  fill="#1a1a2e"
                  listening={false}
                />
              )}

              {/* Overlay */}
              {overlayEnabled && (
                <Rect
                  width={CANVAS_WIDTH * scale}
                  height={canvasHeight * scale}
                  fill={overlayColor}
                  opacity={overlayOpacity}
                  listening={false}
                />
              )}

              {/* Text zones with actual content */}
              {textZones.map((zone) => {
                const override = slide.zone_overrides?.[zone.id] ?? {}
                const effectiveX = (override.x ?? zone.x) * scale
                const effectiveY = (override.y ?? zone.y) * scale
                const effectiveWidth = (override.width ?? zone.width) * scale
                const effectiveHeight = (override.height ?? zone.height) * scale
                const effectiveFontSize = (override.fontSize ?? zone.fontSize ?? 40) * scale
                const effectiveFontWeight = override.fontWeight ?? 'normal'
                const effectiveTextAlign = override.textAlign ?? 'center'
                const effectiveFontFamily = override.fontFamily ?? (
                  zone.type === 'hook' && guidance?.headlineFont ? 'CustomHeadline' :
                  zone.type === 'body' && guidance?.bodyFont ? 'CustomBody' :
                  zone.type === 'cta' && guidance?.ctaFont ? 'CustomCTA' :
                  'sans-serif'
                )

                let text = ''
                let color = primaryColor
                if (zone.type === 'hook') {
                  text = slide.hook_text || ''
                  color = override.color ?? primaryColor
                } else if (zone.type === 'body') {
                  text = slide.body_text || ''
                  color = override.color ?? secondaryColor
                } else if (zone.type === 'cta') {
                  text = slide.cta_text || ''
                  color = override.color ?? primaryColor
                }

                const style = ZONE_STYLES[zone.type]
                const isSelected = selectedZoneId === zone.id

                return (
                  <React.Fragment key={zone.id}>
                    {/* Zone background rect (draggable, selectable) */}
                    <Rect
                      id={`slide-zone-${zone.id}`}
                      x={effectiveX}
                      y={effectiveY}
                      width={effectiveWidth}
                      height={effectiveHeight}
                      fill={isSelected ? style.fill : 'transparent'}
                      stroke={isSelected ? style.stroke : 'transparent'}
                      strokeWidth={isSelected ? 2 : 0}
                      draggable
                      onDragEnd={(e) => handleDragEnd(zone.id, e)}
                      onTransformEnd={(e) => handleTransformEnd(zone.id, e)}
                    />
                    {/* Text rendering */}
                    <KonvaText
                      x={effectiveX}
                      y={effectiveY}
                      width={effectiveWidth}
                      height={effectiveHeight}
                      text={text}
                      fontSize={effectiveFontSize}
                      fontFamily={effectiveFontFamily}
                      fontStyle={effectiveFontWeight === 'bold' || effectiveFontWeight === '700' ? 'bold' : 'normal'}
                      fill={color}
                      align={effectiveTextAlign}
                      verticalAlign="middle"
                      lineHeight={1.3}
                      padding={8 * scale}
                      wrap="word"
                      listening={false}
                    />
                  </React.Fragment>
                )
              })}

              {/* Transformer for selected zone */}
              {selectedZoneId && (
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < MIN_ZONE_SIZE * scale || newBox.height < MIN_ZONE_SIZE * scale) {
                      return oldBox
                    }
                    return newBox
                  }}
                />
              )}
            </Layer>
          </Stage>
        </div>
      )}
    </div>
  )
}
