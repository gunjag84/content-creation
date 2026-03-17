import React, { useState, useEffect, useRef } from 'react'
import { Stage, Layer, Rect, Transformer, Image as KonvaImage, Text as KonvaText } from 'react-konva'
import { Button } from '../ui/button'
import type { Settings } from '../../../../shared/types/settings'

export interface Zone {
  id: string
  type: 'hook' | 'body' | 'cta' | 'no-text'
  label?: string // custom content label/placeholder shown on canvas
  x: number // pixels from left (at 1080 scale)
  y: number // pixels from top (at 1080 scale)
  width: number // pixels
  height: number // pixels
  fontSize: number // standard size for zone type
  minFontSize: number // auto-shrink fallback
}

interface ZoneEditorProps {
  backgroundImage: HTMLImageElement | null
  backgroundType: 'image' | 'solid_color' | 'gradient'
  backgroundColor?: string
  overlayColor: string
  overlayOpacity: number
  overlayEnabled: boolean
  zones: Zone[]
  onZonesChange: (zones: Zone[]) => void
  brandGuidance: Settings['visualGuidance']
  format: 'feed' | 'story'
  selectedZoneId?: string | null
  onSelectZone?: (zoneId: string | null) => void
}

export const CANVAS_WIDTH = 1080
export const CANVAS_HEIGHT_FEED = 1350
export const CANVAS_HEIGHT_STORY = 1920
export const MIN_ZONE_SIZE = 50

// Zone visual styling by type
export const ZONE_STYLES = {
  hook: { fill: 'rgba(59, 130, 246, 0.3)', stroke: '#3b82f6' },
  body: { fill: 'rgba(34, 197, 94, 0.3)', stroke: '#22c55e' },
  cta: { fill: 'rgba(249, 115, 22, 0.3)', stroke: '#f97316' },
  'no-text': { fill: 'rgba(239, 68, 68, 0.3)', stroke: '#ef4444' }
}

const SAMPLE_TEXT = {
  hook: 'Your hook text here',
  body: 'Body text content goes in this area',
  cta: 'Call to action',
  'no-text': 'No Text Zone'
}

export function ZoneEditor({
  backgroundImage,
  backgroundType,
  backgroundColor = '#ffffff',
  overlayColor,
  overlayOpacity,
  overlayEnabled,
  zones,
  onZonesChange,
  brandGuidance,
  format,
  selectedZoneId: externalSelectedZoneId,
  onSelectZone
}: ZoneEditorProps) {
  const [drawMode, setDrawMode] = useState(false)
  // Use external selection if provided, otherwise internal
  const [internalSelectedZoneId, setInternalSelectedZoneId] = useState<string | null>(null)
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null)
  const [tempZone, setTempZone] = useState<Zone | null>(null)
  // Image position for panning (canvas coords) - keeps original aspect ratio, user can move
  const [imageOffset, setImageOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  const containerRef = useRef<HTMLDivElement>(null)
  const transformerRef = useRef<any>(null)
  const stageRef = useRef<any>(null)

  const selectedZoneId = externalSelectedZoneId !== undefined ? externalSelectedZoneId : internalSelectedZoneId
  const setSelectedZoneId = (id: string | null) => {
    if (onSelectZone) {
      onSelectZone(id)
    } else {
      setInternalSelectedZoneId(id)
    }
  }

  const canvasHeight = format === 'feed' ? CANVAS_HEIGHT_FEED : CANVAS_HEIGHT_STORY
  const scale = containerSize ? containerSize.width / CANVAS_WIDTH : 1

  // Responsive canvas sizing - always fit to container, no height adjustment with image size
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        const width = entry.contentRect.width
        const height = entry.contentRect.height
        const scaleByWidth = width / CANVAS_WIDTH
        const scaleByHeight = height > 0 ? height / canvasHeight : scaleByWidth
        const constrainedScale = Math.min(scaleByWidth, scaleByHeight)
        const constrainedWidth = CANVAS_WIDTH * constrainedScale
        const constrainedHeight = canvasHeight * constrainedScale
        setContainerSize({ width: constrainedWidth, height: constrainedHeight })
      }
    })

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [canvasHeight])

  // Reset image position when background image changes (scale so smaller side fills frame)
  useEffect(() => {
    if (backgroundType === 'image' && backgroundImage && containerSize) {
      const imgW = backgroundImage.naturalWidth
      const imgH = backgroundImage.naturalHeight
      const fitScale = Math.max(CANVAS_WIDTH / imgW, canvasHeight / imgH)
      const imgCanvasW = imgW * fitScale
      const imgCanvasH = imgH * fitScale
      setImageOffset({
        x: (CANVAS_WIDTH - imgCanvasW) / 2,
        y: (canvasHeight - imgCanvasH) / 2
      })
    }
  }, [backgroundImage, backgroundType, canvasHeight, containerSize])

  // Update transformer when selection changes
  useEffect(() => {
    if (transformerRef.current && selectedZoneId) {
      const stage = stageRef.current
      if (!stage) return

      const node = stage.findOne(`#zone-${selectedZoneId}`)
      if (node) {
        transformerRef.current.nodes([node])
        transformerRef.current.getLayer().batchDraw()
      }
    }
  }, [selectedZoneId])

  const generateZoneId = () => `zone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const getFontSizeForType = (type: Zone['type']): number => {
    if (!brandGuidance) return 24
    switch (type) {
      case 'hook':
        return brandGuidance.headlineFontSize || 48
      case 'body':
        return brandGuidance.bodyFontSize || 24
      case 'cta':
        return brandGuidance.ctaFontSize || 32
      case 'no-text':
        return 16
    }
  }

  const handleStageMouseDown = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage()

    if (!clickedOnEmpty) {
      // Clicked on a zone rect
      const clickedId = e.target.id().replace('zone-', '')
      if (clickedId && zones.some((z) => z.id === clickedId)) {
        setSelectedZoneId(clickedId)
        setDrawMode(false)
      }
      return
    }

    // Clicked on empty canvas
    setSelectedZoneId(null)

    if (drawMode) {
      const stage = e.target.getStage()
      const pos = stage.getPointerPosition()
      const x = pos.x / scale
      const y = pos.y / scale

      setIsDrawing(true)
      setDrawStart({ x, y })
    }
  }

  const handleStageMouseMove = (e: any) => {
    if (!isDrawing || !drawStart) return

    const stage = e.target.getStage()
    const pos = stage.getPointerPosition()
    const x = pos.x / scale
    const y = pos.y / scale

    const width = Math.abs(x - drawStart.x)
    const height = Math.abs(y - drawStart.y)
    const finalX = Math.min(drawStart.x, x)
    const finalY = Math.min(drawStart.y, y)

    setTempZone({
      id: 'temp',
      type: 'body',
      x: finalX,
      y: finalY,
      width,
      height,
      fontSize: getFontSizeForType('body'),
      minFontSize: brandGuidance?.minFontSize || 14
    })
  }

  const handleStageMouseUp = (e: any) => {
    if (isDrawing && drawStart) {
      let finalZone = tempZone

      if (!finalZone) {
        const stage = e.target.getStage()
        const pos = stage.getPointerPosition()
        const x = pos.x / scale
        const y = pos.y / scale

        const width = Math.abs(x - drawStart.x)
        const height = Math.abs(y - drawStart.y)
        const finalX = Math.min(drawStart.x, x)
        const finalY = Math.min(drawStart.y, y)

        finalZone = {
          id: 'temp',
          type: 'body',
          x: finalX,
          y: finalY,
          width,
          height,
          fontSize: getFontSizeForType('body'),
          minFontSize: brandGuidance?.minFontSize || 14
        }
      }

      if (finalZone.width >= MIN_ZONE_SIZE && finalZone.height >= MIN_ZONE_SIZE) {
        const newZone: Zone = {
          ...finalZone,
          id: generateZoneId()
        }
        onZonesChange([...zones, newZone])
        setSelectedZoneId(newZone.id)
      }

      setIsDrawing(false)
      setDrawStart(null)
      setTempZone(null)
    }
  }

  const handleZoneDragEnd = (zoneId: string, e: any) => {
    const node = e.target
    const updatedZones = zones.map((zone) =>
      zone.id === zoneId
        ? {
            ...zone,
            x: Math.max(0, Math.min(node.x() / scale, CANVAS_WIDTH - zone.width)),
            y: Math.max(0, Math.min(node.y() / scale, canvasHeight - zone.height))
          }
        : zone
    )
    onZonesChange(updatedZones)
  }

  const handleZoneTransformEnd = (zoneId: string, e: any) => {
    const node = e.target
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    const newDisplayWidth = Math.max(MIN_ZONE_SIZE * scale, node.width() * scaleX)
    const newDisplayHeight = Math.max(MIN_ZONE_SIZE * scale, node.height() * scaleY)
    const newCanvasWidth = newDisplayWidth / scale
    const newCanvasHeight = newDisplayHeight / scale

    // Update node dimensions before resetting scale so it doesn't snap back to text size
    node.width(newDisplayWidth)
    node.height(newDisplayHeight)
    node.scaleX(1)
    node.scaleY(1)

    const updatedZones = zones.map((zone) =>
      zone.id === zoneId
        ? {
            ...zone,
            x: Math.max(0, node.x() / scale),
            y: Math.max(0, node.y() / scale),
            width: newCanvasWidth,
            height: newCanvasHeight
          }
        : zone
    )
    onZonesChange(updatedZones)
  }

  const handleDeleteSelected = () => {
    if (selectedZoneId) {
      onZonesChange(zones.filter((z) => z.id !== selectedZoneId))
      setSelectedZoneId(null)
    }
  }

  const renderZone = (zone: Zone, isTemp = false) => {
    const style = ZONE_STYLES[zone.type]
    const text = zone.label || SAMPLE_TEXT[zone.type]

    return (
      <React.Fragment key={zone.id}>
        <Rect
          id={isTemp ? undefined : `zone-${zone.id}`}
          x={zone.x * scale}
          y={zone.y * scale}
          width={zone.width * scale}
          height={zone.height * scale}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={2}
          dash={zone.type === 'no-text' ? [10, 5] : undefined}
          draggable={!isTemp && !drawMode}
          onDragEnd={(e) => !isTemp && handleZoneDragEnd(zone.id, e)}
          onTransformEnd={(e) => !isTemp && handleZoneTransformEnd(zone.id, e)}
        />
        {zone.type !== 'no-text' && (
          <KonvaText
            x={zone.x * scale}
            y={zone.y * scale}
            width={zone.width * scale}
            height={zone.height * scale}
            text={text}
            fontSize={Math.max(12, zone.fontSize * scale * 0.5)}
            fill="#333"
            align="center"
            verticalAlign="middle"
            padding={10 * scale}
            listening={false}
          />
        )}
      </React.Fragment>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between p-2 bg-slate-800 rounded-lg border border-slate-700">
        <div className="flex gap-2">
          <Button
            variant={drawMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setDrawMode(!drawMode)
              setSelectedZoneId(null)
            }}
            className={drawMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
          >
            {drawMode ? 'Cancel Drawing' : 'Draw Zone'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteSelected}
            disabled={!selectedZoneId}
            className="border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
          >
            Delete Selected
          </Button>
        </div>
        <div className="text-sm text-slate-400">{zones.length} zones</div>
      </div>

      {zones.length === 0 && (
        <p className="text-xs text-slate-500 text-center shrink-0">
          Click "Draw Zone" then drag on the canvas to define text areas
        </p>
      )}

      {/* Canvas - fills remaining space, scales to fit */}
      <div ref={containerRef} className="flex-1 min-h-0 w-full flex items-center justify-center">
        {containerSize && (
        <div
          className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900 mx-auto"
          style={{
            width: containerSize.width,
            height: containerSize.height,
            cursor: drawMode ? 'crosshair' : 'default'
          }}
        >
        <Stage
          ref={stageRef}
          width={containerSize.width}
          height={containerSize.height}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
        >
          <Layer>
            {/* Background - image: scale so smaller side fills frame, draggable for panning */}
            {backgroundType === 'image' && backgroundImage && (() => {
              const imgW = backgroundImage.naturalWidth
              const imgH = backgroundImage.naturalHeight
              const fitScale = Math.max(CANVAS_WIDTH / imgW, canvasHeight / imgH)
              const imgCanvasW = imgW * fitScale
              const imgCanvasH = imgH * fitScale
              return (
                <KonvaImage
                  image={backgroundImage}
                  x={imageOffset.x * scale}
                  y={imageOffset.y * scale}
                  width={imgCanvasW * scale}
                  height={imgCanvasH * scale}
                  draggable={!drawMode}
                  listening={!drawMode}
                  onDragEnd={(e) => {
                    const node = e.target
                    setImageOffset({ x: node.x() / scale, y: node.y() / scale })
                  }}
                  onDragStart={() => setSelectedZoneId(null)}
                />
              )
            })()}
            {backgroundType === 'solid_color' && (
              <Rect
                width={CANVAS_WIDTH * scale}
                height={canvasHeight * scale}
                fill={backgroundColor}
                listening={false}
              />
            )}
            {backgroundType === 'gradient' && backgroundColor && (() => {
              const parts = backgroundColor.split(',')
              const color1 = parts[0] || '#000000'
              const color2 = parts[1] || '#ffffff'
              const direction = parts[2] || 'vertical'
              const w = CANVAS_WIDTH * scale
              const h = canvasHeight * scale
              let startPoint = { x: 0, y: 0 }
              let endPoint = { x: 0, y: h }
              if (direction === 'horizontal') {
                endPoint = { x: w, y: 0 }
              } else if (direction === 'diagonal') {
                endPoint = { x: w, y: h }
              }
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
            })()}

            {/* Overlay */}
            {overlayEnabled && (
              <Rect
                width={CANVAS_WIDTH * scale}
                height={canvasHeight * scale}
                fill={overlayColor}
                opacity={overlayOpacity / 100}
                listening={false}
              />
            )}

            {/* Zones */}
            {zones.map((zone) => renderZone(zone))}
            {tempZone && renderZone(tempZone, true)}

            {/* Instructional overlay when canvas is empty and not in draw mode */}
            {zones.length === 0 && !drawMode && (
              <>
                <Rect
                  width={containerSize.width}
                  height={containerSize.height}
                  fill="rgba(0,0,0,0.4)"
                  listening={false}
                />
                <KonvaText
                  x={0}
                  y={containerSize.height / 2 - 30}
                  width={containerSize.width}
                  text={'Click "Draw Zone" above, then\ndrag to define text zones on the canvas'}
                  fontSize={14}
                  fill="#94a3b8"
                  align="center"
                  listening={false}
                />
              </>
            )}

            {/* Transformer for selected zone */}
            {selectedZoneId && !drawMode && (
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < MIN_ZONE_SIZE || newBox.height < MIN_ZONE_SIZE) {
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
    </div>
  )
}
