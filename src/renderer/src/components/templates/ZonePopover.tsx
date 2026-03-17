import React from 'react'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import type { Zone } from './ZoneEditor'
import type { Settings } from '../../../../shared/types/settings'

interface ZonePopoverProps {
  zone: Zone
  onUpdate: (updates: Partial<Zone>) => void
  onDelete: () => void
  brandGuidance: Settings['visualGuidance']
}

const ZONE_TYPES: { value: Zone['type']; label: string }[] = [
  { value: 'hook', label: 'Title' },
  { value: 'body', label: 'Body' },
  { value: 'cta', label: 'CTA' },
  { value: 'no-text', label: 'No Text' },
]

export function ZonePopover({
  zone,
  onUpdate,
  onDelete,
  brandGuidance
}: ZonePopoverProps) {
  const approximateCharCount = Math.floor((zone.width * zone.height) / (zone.fontSize * 10))

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ label: e.target.value || undefined })
  }

  const handleMinFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value > 0) {
      onUpdate({ minFontSize: value })
    }
  }

  return (
    <div className="space-y-4">
      {/* Zone Type Buttons */}
      <div className="space-y-2">
        <Label className="text-xs text-slate-400">Zone Type</Label>
        <div className="grid grid-cols-4 gap-1">
          {ZONE_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onUpdate({ type: value })}
              className={`py-1.5 px-2 text-xs rounded font-medium transition-colors ${
                zone.type === value
                  ? value === 'hook'
                    ? 'bg-blue-600 text-white'
                    : value === 'body'
                    ? 'bg-green-600 text-white'
                    : value === 'cta'
                    ? 'bg-orange-600 text-white'
                    : 'bg-red-700 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Label */}
      {zone.type !== 'no-text' && (
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-400">Content Label</Label>
          <Input
            type="text"
            placeholder={
              zone.type === 'hook' ? 'e.g. Attention hook...' :
              zone.type === 'body' ? 'e.g. Main benefit...' :
              'e.g. Buy now...'
            }
            value={zone.label || ''}
            onChange={handleLabelChange}
            className="h-8 text-sm bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500"
          />
        </div>
      )}

      {/* Font Size + Char Count row */}
      {zone.type !== 'no-text' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400">Font Size</Label>
            <div className="text-xs text-slate-300 bg-slate-700 px-2 py-1.5 rounded">
              {zone.fontSize}px
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400">~Chars</Label>
            <div className="text-xs text-slate-300 bg-slate-700 px-2 py-1.5 rounded">
              ~{approximateCharCount}
            </div>
          </div>
        </div>
      )}

      {/* Min Font Size */}
      {zone.type !== 'no-text' && (
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-400">Min Font Size</Label>
          <Input
            type="number"
            min="8"
            max={zone.fontSize}
            value={zone.minFontSize}
            onChange={handleMinFontSizeChange}
            className="h-8 text-sm bg-slate-700 border-slate-600 text-slate-100"
          />
        </div>
      )}

      {/* Delete */}
      <Button
        variant="outline"
        size="sm"
        onClick={onDelete}
        className="w-full h-8 text-xs border-red-700 text-red-400 hover:bg-red-950 hover:text-red-300"
      >
        Delete Zone
      </Button>
    </div>
  )
}
