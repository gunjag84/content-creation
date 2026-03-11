import React, { useState, useRef, useEffect } from 'react'
import { HexColorPicker, HexColorInput } from 'react-colorful'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Slider } from '../ui/slider'

interface OverlayControlsProps {
  enabled: boolean
  color: string
  opacity: number
  onChange: (updates: { enabled?: boolean; color?: string; opacity?: number }) => void
}

export function OverlayControls({ enabled, color, opacity, onChange }: OverlayControlsProps) {
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close popover when clicking outside
  useEffect(() => {
    if (!isColorPickerOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        buttonRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsColorPickerOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isColorPickerOpen])

  return (
    <div className="space-y-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
      <h3 className="font-semibold text-sm text-slate-200">Overlay Settings</h3>

      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="overlay-enabled" className="text-slate-300">Enable Overlay</Label>
        <Switch
          id="overlay-enabled"
          checked={enabled}
          onCheckedChange={(checked) => onChange({ enabled: checked })}
        />
      </div>

      {/* Color Picker (only when enabled) */}
      {enabled && (
        <>
          <div className="space-y-2">
            <Label className="text-slate-300">Overlay Color</Label>
            <div className="flex items-center gap-3 relative">
              {/* Color swatch button */}
              <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                className="w-12 h-12 rounded-md border-2 border-slate-600 cursor-pointer hover:border-gray-400 transition-colors shadow-sm"
                style={{ backgroundColor: color }}
                title="Pick overlay color"
              />

              {/* Hex input */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">#</span>
                <HexColorInput
                  color={color}
                  onChange={(newColor) => onChange({ color: newColor })}
                  prefixed={false}
                  className="w-24 px-2 py-1 text-sm border border-slate-600 bg-slate-700 text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Color picker popover */}
              {isColorPickerOpen && (
                <div
                  ref={popoverRef}
                  className="absolute top-14 left-0 z-50 bg-slate-800 rounded-lg shadow-xl border border-slate-600 p-3"
                >
                  <HexColorPicker
                    color={color}
                    onChange={(newColor) => onChange({ color: newColor })}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Opacity Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-slate-300">Opacity</Label>
              <span className="text-sm text-slate-300">{opacity}%</span>
            </div>
            <Slider
              value={[opacity]}
              onValueChange={(values) => onChange({ opacity: values[0] })}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        </>
      )}
    </div>
  )
}
