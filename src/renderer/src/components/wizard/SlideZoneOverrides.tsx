import { useState, useRef, useEffect } from 'react'
import { HexColorPicker } from 'react-colorful'
import { ChevronDown, ChevronUp, Layers, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { Slider } from '../ui/slider'
import { useCreatePostStore } from '../../stores/useCreatePostStore'
import type { Zone } from '../templates/ZoneEditor'
import type { Settings } from '../../../../shared/types/settings'

const ZONE_COLORS: Record<string, string> = {
  hook: '#3b82f6',
  body: '#22c55e',
  cta: '#f97316'
}

const SYSTEM_FONTS = [
  'sans-serif',
  'serif',
  'monospace',
  'Arial',
  'Georgia',
  'Helvetica',
  'Times New Roman',
  'Verdana',
]

interface ColorPickerPopoverProps {
  color: string
  onChange: (color: string) => void
  onCommit: (color: string) => void
}

function ColorPickerPopover({ color, onChange, onCommit }: ColorPickerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localColor, setLocalColor] = useState(color)
  const [hexInput, setHexInput] = useState(color.replace('#', ''))
  const popoverRef = useRef<HTMLDivElement>(null)
  const swatchRef = useRef<HTMLButtonElement>(null)

  // Sync local color when external color changes
  useEffect(() => {
    setLocalColor(color)
    setHexInput(color.replace('#', ''))
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

  const handlePickerChange = (newColor: string) => {
    setLocalColor(newColor)
    setHexInput(newColor.replace('#', ''))
    onChange(newColor)
  }

  const handleHexInputChange = (value: string) => {
    const clean = value.replace('#', '')
    if (/^[0-9A-Fa-f]{0,6}$/.test(clean)) {
      setHexInput(clean)
      if (clean.length === 6 || clean.length === 3) {
        const fullColor = `#${clean}`
        setLocalColor(fullColor)
        onChange(fullColor)
      }
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    onCommit(localColor)
  }

  return (
    <div className="relative flex items-center gap-2">
      <button
        ref={swatchRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-6 w-6 rounded border border-slate-500 cursor-pointer hover:border-slate-300 transition-colors shrink-0"
        style={{ backgroundColor: localColor }}
        title="Pick color"
      />
      {/* Hex text input */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-500">#</span>
        <input
          type="text"
          value={hexInput}
          onChange={(e) => handleHexInputChange(e.target.value)}
          maxLength={6}
          className="w-16 px-1.5 py-0.5 text-xs bg-slate-700 border border-slate-600 rounded text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="ffffff"
        />
      </div>
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-8 z-50 rounded-lg border border-slate-600 bg-slate-800 p-3 shadow-xl"
        >
          <HexColorPicker color={localColor} onChange={handlePickerChange} />
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
  settings?: Settings | null
  selectedZoneId?: string | null
  onSelectZone?: (zoneId: string | null) => void
}

export function SlideZoneOverrides({ zones, slideIndex, settings, selectedZoneId, onSelectZone }: SlideZoneOverridesProps) {
  const [expanded, setExpanded] = useState(true)
  const { generatedSlides, setZoneOverride } = useCreatePostStore()
  const slide = generatedSlides[slideIndex]

  const textZones = zones.filter(z => z.type !== 'no-text')

  if (!slide || textZones.length === 0) return null

  // Build font options from settings + system fonts
  const customFonts: string[] = []
  const guidance = settings?.visualGuidance
  if (guidance?.headlineFont?.path) customFonts.push('CustomHeadline')
  if (guidance?.bodyFont?.path) customFonts.push('CustomBody')
  if (guidance?.ctaFont?.path) customFonts.push('CustomCTA')

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
            const currentTextAlign = overrides.textAlign ?? 'center'
            const currentFontFamily = overrides.fontFamily ?? ''

            const defaultColor =
              zone.type === 'body' ? '#cccccc' : '#ffffff'
            const currentColor = overrides.color ?? defaultColor

            const isSelected = selectedZoneId === zone.id

            return (
              <div
                key={zone.id}
                className={`space-y-3 rounded-lg p-2 transition-colors cursor-pointer ${
                  isSelected ? 'bg-slate-700/50 ring-1 ring-blue-500/50' : 'hover:bg-slate-700/30'
                }`}
                onClick={() => onSelectZone?.(zone.id)}
              >
                {/* Zone Label */}
                <div
                  className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: ZONE_COLORS[zone.type] ?? '#64748b' }}
                >
                  {zone.label || zone.type}
                </div>

                {/* Font Family */}
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">Font</span>
                  <select
                    value={currentFontFamily}
                    onChange={(e) =>
                      setZoneOverride(slideIndex, zone.id, { fontFamily: e.target.value || undefined })
                    }
                    className="w-full h-7 text-xs bg-slate-700 border border-slate-600 rounded text-slate-200 px-2"
                  >
                    <option value="">Default</option>
                    {customFonts.length > 0 && (
                      <optgroup label="Custom Fonts">
                        {customFonts.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="System Fonts">
                      {SYSTEM_FONTS.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </optgroup>
                  </select>
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
                    onValueChange={([val]) =>
                      setZoneOverride(slideIndex, zone.id, { fontSize: val })
                    }
                    className="w-full"
                  />
                </div>

                {/* Font Weight + Text Align row */}
                <div className="flex items-center gap-4">
                  {/* Font Weight */}
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500">Weight</span>
                    <div className="flex gap-1">
                      {(['normal', 'bold'] as const).map(weight => (
                        <button
                          key={weight}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setZoneOverride(slideIndex, zone.id, { fontWeight: weight })
                          }}
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

                  {/* Text Align */}
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500">Align</span>
                    <div className="flex gap-1">
                      {([
                        { value: 'left' as const, icon: AlignLeft },
                        { value: 'center' as const, icon: AlignCenter },
                        { value: 'right' as const, icon: AlignRight }
                      ]).map(({ value, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setZoneOverride(slideIndex, zone.id, { textAlign: value })
                          }}
                          className={`rounded p-1.5 transition-colors ${
                            currentTextAlign === value
                              ? 'bg-slate-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          <Icon size={14} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Color with hex input */}
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <span className="text-xs text-slate-500">Color</span>
                  <ColorPickerPopover
                    color={currentColor}
                    onChange={(val) => {
                      useCreatePostStore
                        .getState()
                        .setZoneOverride(slideIndex, zone.id, { color: val })
                    }}
                    onCommit={(val) =>
                      setZoneOverride(slideIndex, zone.id, { color: val })
                    }
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
