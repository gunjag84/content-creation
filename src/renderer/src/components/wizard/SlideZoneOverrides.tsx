import { useState, useRef, useEffect } from 'react'
import { HexColorPicker } from 'react-colorful'
import { ChevronDown, ChevronUp, Layers } from 'lucide-react'
import { Slider } from '../ui/slider'
import { useCreatePostStore } from '../../stores/useCreatePostStore'
import type { Zone } from '../templates/ZoneEditor'

const ZONE_COLORS: Record<string, string> = {
  hook: '#3b82f6',
  body: '#22c55e',
  cta: '#f97316'
}

interface ColorPickerPopoverProps {
  color: string
  onChange: (color: string) => void
  onCommit: (color: string) => void
}

function ColorPickerPopover({ color, onChange, onCommit }: ColorPickerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localColor, setLocalColor] = useState(color)
  const popoverRef = useRef<HTMLDivElement>(null)
  const swatchRef = useRef<HTMLButtonElement>(null)

  // Sync local color when external color changes (e.g. on slide switch)
  useEffect(() => {
    setLocalColor(color)
  }, [color])

  // Close popover on outside click and commit
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        swatchRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !swatchRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
        onCommit(localColor)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, localColor, onCommit])

  const handleChange = (newColor: string) => {
    setLocalColor(newColor)
    onChange(newColor)
  }

  const handleClose = () => {
    setIsOpen(false)
    onCommit(localColor)
  }

  return (
    <div className="relative">
      <button
        ref={swatchRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-6 w-6 rounded border border-slate-500 cursor-pointer hover:border-slate-300 transition-colors"
        style={{ backgroundColor: localColor }}
        title="Pick color"
      />
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-8 z-50 rounded-lg border border-slate-600 bg-slate-800 p-3 shadow-xl"
        >
          <HexColorPicker color={localColor} onChange={handleChange} />
          <button
            className="mt-2 w-full rounded bg-slate-700 py-1 text-xs text-slate-300 hover:bg-slate-600"
            onClick={handleClose}
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}

interface SlideZoneOverridesProps {
  zones: Zone[]
  slideIndex: number
}

export function SlideZoneOverrides({ zones, slideIndex }: SlideZoneOverridesProps) {
  const [expanded, setExpanded] = useState(true)
  const { generatedSlides, setZoneOverride } = useCreatePostStore()
  const slide = generatedSlides[slideIndex]

  const textZones = zones.filter(z => z.type !== 'no-text')

  if (!slide || textZones.length === 0) return null

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800">
      {/* Section Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <Layers size={15} />
          <span>Zone Overrides</span>
        </div>
        {expanded ? (
          <ChevronUp size={15} className="text-slate-500" />
        ) : (
          <ChevronDown size={15} className="text-slate-500" />
        )}
      </button>

      {expanded && (
        <div className="space-y-5 border-t border-slate-700 px-4 pb-4 pt-4">
          {textZones.map(zone => {
            const overrides = slide.zone_overrides?.[zone.id] ?? {}
            const currentFontSize = overrides.fontSize ?? zone.fontSize
            const currentFontWeight = overrides.fontWeight ?? 'normal'
            const xDelta = (overrides.x ?? zone.x) - zone.x
            const yDelta = (overrides.y ?? zone.y) - zone.y

            // Default color: hook/cta use primaryColor, body uses secondaryColor
            const defaultColor =
              zone.type === 'body' ? '#cccccc' : '#ffffff'
            const currentColor = overrides.color ?? defaultColor

            return (
              <div key={zone.id} className="space-y-3">
                {/* Zone Label */}
                <div
                  className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: ZONE_COLORS[zone.type] ?? '#64748b' }}
                >
                  {zone.label || zone.type}
                </div>

                {/* Font Size */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Font size</span>
                    <span className="text-xs text-slate-300">{currentFontSize}px</span>
                  </div>
                  <Slider
                    min={12}
                    max={120}
                    step={1}
                    value={[currentFontSize]}
                    onValueCommit={([val]) =>
                      setZoneOverride(slideIndex, zone.id, { fontSize: val })
                    }
                    className="w-full"
                  />
                </div>

                {/* Font Weight */}
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">Font weight</span>
                  <div className="flex gap-1">
                    {(['normal', 'bold'] as const).map(weight => (
                      <button
                        key={weight}
                        type="button"
                        onClick={() =>
                          setZoneOverride(slideIndex, zone.id, { fontWeight: weight })
                        }
                        className={`rounded px-3 py-1 text-xs capitalize transition-colors ${
                          currentFontWeight === weight
                            ? 'bg-slate-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {weight}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Color</span>
                  <ColorPickerPopover
                    color={currentColor}
                    onChange={(val) => {
                      // Optimistic local preview — no history entry yet
                      useCreatePostStore
                        .getState()
                        .setZoneOverride(slideIndex, zone.id, { color: val })
                    }}
                    onCommit={(val) =>
                      setZoneOverride(slideIndex, zone.id, { color: val })
                    }
                  />
                  <span className="text-xs text-slate-400">{currentColor}</span>
                </div>

                {/* X Offset */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">X offset</span>
                    <span className="text-xs text-slate-300">
                      {xDelta >= 0 ? '+' : ''}
                      {xDelta}px
                    </span>
                  </div>
                  <Slider
                    min={-200}
                    max={200}
                    step={1}
                    value={[xDelta]}
                    onValueCommit={([delta]) =>
                      setZoneOverride(slideIndex, zone.id, { x: zone.x + delta })
                    }
                    className="w-full"
                  />
                </div>

                {/* Y Offset */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Y offset</span>
                    <span className="text-xs text-slate-300">
                      {yDelta >= 0 ? '+' : ''}
                      {yDelta}px
                    </span>
                  </div>
                  <Slider
                    min={-200}
                    max={200}
                    step={1}
                    value={[yDelta]}
                    onValueCommit={([delta]) =>
                      setZoneOverride(slideIndex, zone.id, { y: zone.y + delta })
                    }
                    className="w-full"
                  />
                </div>

                <div className="border-t border-slate-700" />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
