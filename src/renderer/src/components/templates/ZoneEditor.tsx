import React, { useState, useEffect, useRef } from 'react'
import { Stage, Layer, Rect, Transformer, Image as KonvaImage, Text as KonvaText } from 'react-konva'
import { Button } from '../ui/button'
import { ZonePopover } from './ZonePopover'
import type { Settings } from '../../../../shared/types/settings'

export interface Zone {
  id: string
  type: 'hook' | 'body' | 'cta' | 'no-text'
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
}

const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT_FEED = 1350
const CANVAS_HEIGHT_STORY = 1920
const MIN_ZONE_SIZE = 50

// Zone visual styling by type
const ZONE_STYLES = {
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
  format
}: ZoneEditorProps) {
  const [drawMode, setDrawMode] = useState(false)
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null)
  const [containerSize, setContainerSize] = useState({ width: 700, height: 875 })
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null)
  const [tempZone, setTempZone] = useState<Zone | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const transformerRef = useRef<any>(null)
  const stageRef = useRef<any>(null)

  const canvasHeight = format === 'feed' ? CANVAS_HEIGHT_FEED : CANVAS_HEIGHT_STORY
  const scale = containerSize.width / CANVAS_WIDTH

  // Responsive canvas sizing
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        const width = entry.contentRect.width
        const height = (width / CANVAS_WIDTH) * canvasHeight
        setContainerSize({ width, height })
      }
    })

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [canvasHeight])

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
      // Clicked on a zone
      const clickedId = e.target.id().replace('zone-', '')
      if (clickedId && zones.some((z) => z.id === clickedId)) {
        setSelectedZoneId(clickedId)
        setDrawMode(false)

        // Position popover near the zone
        const stage = e.target.getStage()
        const pointerPos = stage.getPointerPosition()
        setPopoverPosition({
          x: pointerPos.x,
          y: pointerPos.y - 20
        })
      }
      return
    }

    // Clicked on empty canvas
    setSelectedZoneId(null)
    setPopoverPosition(null)

    if (drawMode) {
      // Start drawing new zone
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

  const handleStageMouseUp = () => {
    if (isDrawing && tempZone && drawStart) {
      // Finalize the zone
      if (tempZone.width >= MIN_ZONE_SIZE && tempZone.height >= MIN_ZONE_SIZE) {
        const newZone: Zone = {
          ...tempZone,
          id: generateZoneId()
        }
        onZonesChange([...zones, newZone])
        setSelectedZoneId(newZone.id)

        // Position popover for the new zone
        const stage = stageRef.current
        if (stage) {
          const pos = stage.getPointerPosition()
          setPopoverPosition({
            x: pos.x,
            y: Math.max(20, pos.y - 100)
          })
        }
      }

      setIsDrawing(false)
      setDrawStart(null)
      setTempZone(null)
      setDrawMode(false)
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

    // Reset scale and apply to width/height
    node.scaleX(1)
    node.scaleY(1)

    const updatedZones = zones.map((zone) =>
      zone.id === zoneId
        ? {
            ...zone,
            x: Math.max(0, node.x() / scale),
            y: Math.max(0, node.y() / scale),
            width: Math.max(MIN_ZONE_SIZE, node.width() * scaleX),
            height: Math.max(MIN_ZONE_SIZE, node.height() * scaleY)
          }
        : zone
    )
    onZonesChange(updatedZones)
  }

  const handleZoneUpdate = (zoneId: string, updates: Partial<Zone>) => {
    const updatedZones = zones.map((zone) => {
      if (zone.id === zoneId) {
        const newZone = { ...zone, ...updates }
        // Auto-update fontSize when type changes
        if (updates.type && updates.type !== zone.type) {
          newZone.fontSize = getFontSizeForType(updates.type)
        }
        return newZone
      }
      return zone
    })
    onZonesChange(updatedZones)
  }

  const handleZoneDelete = (zoneId: string) => {
    onZonesChange(zones.filter((z) => z.id !== zoneId))
    setSelectedZoneId(null)
    setPopoverPosition(null)
  }

  const handleDeleteSelected = () => {
    if (selectedZoneId) {
      handleZoneDelete(selectedZoneId)
    }
  }

  const selectedZone = zones.find((z) => z.id === selectedZoneId)

  const renderZone = (zone: Zone, isTemp = false) => {
    const style = ZONE_STYLES[zone.type]
    const text = SAMPLE_TEXT[zone.type]

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
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
        <div className="flex gap-2">
          <Button
            variant={drawMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setDrawMode(!drawMode)
              setSelectedZoneId(null)
              setPopoverPosition(null)
            }}
          >
            {drawMode ? 'Cancel Drawing' : 'Draw Zone'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteSelected}
            disabled={!selectedZoneId}
          >
            Delete Selected
          </Button>
        </div>
        <div className="text-sm text-gray-600">{zones.length} zones defined</div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="border rounded-lg overflow-hidden bg-gray-100"
        style={{ cursor: drawMode ? 'crosshair' : 'default' }}
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
            {/* Background */}
            {backgroundType === 'image' && backgroundImage && (
              <KonvaImage
                image={backgroundImage}
                width={CANVAS_WIDTH * scale}
                height={canvasHeight * scale}
              />
            )}
            {backgroundType === 'solid_color' && (
              <Rect
                width={CANVAS_WIDTH * scale}
                height={canvasHeight * scale}
                fill={backgroundColor}
              />
            )}
            {backgroundType === 'gradient' && backgroundColor && (
              <Rect
                width={CANVAS_WIDTH * scale}
                height={canvasHeight * scale}
                fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                fillLinearGradientEndPoint={{ x: 0, y: canvasHeight * scale }}
                fillLinearGradientColorStops={[
                  0,
                  backgroundColor.split(',')[0] || '#000000',
                  1,
                  backgroundColor.split(',')[1] || '#ffffff'
                ]}
              />
            )}

            {/* Overlay */}
            {overlayEnabled && (
              <Rect
                width={CANVAS_WIDTH * scale}
                height={canvasHeight * scale}
                fill={overlayColor}
                opacity={overlayOpacity / 100}
              />
            )}

            {/* Zones */}
            {zones.map((zone) => renderZone(zone))}
            {tempZone && renderZone(tempZone, true)}

            {/* Transformer for selected zone */}
            {selectedZoneId && !drawMode && (
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  // Limit minimum size
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

      {/* Zone Popover */}
      {selectedZone && popoverPosition && (
        <ZonePopover
          zone={selectedZone}
          position={popoverPosition}
          onUpdate={(updates) => handleZoneUpdate(selectedZone.id, updates)}
          onDelete={() => handleZoneDelete(selectedZone.id)}
          brandGuidance={brandGuidance}
          onClose={() => {
            setSelectedZoneId(null)
            setPopoverPosition(null)
          }}
        />
      )}
    </div>
  )
}
