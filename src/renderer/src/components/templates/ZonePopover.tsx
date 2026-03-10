import React, { useEffect, useRef } from 'react'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select'
import type { Zone } from './ZoneEditor'
import type { Settings } from '../../../../shared/types/settings'

interface ZonePopoverProps {
  zone: Zone
  position: { x: number; y: number }
  onUpdate: (updates: Partial<Zone>) => void
  onDelete: () => void
  brandGuidance: Settings['visualGuidance']
  onClose: () => void
}

export function ZonePopover({
  zone,
  position,
  onUpdate,
  onDelete,
  brandGuidance,
  onClose
}: ZonePopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    // Delay adding listener to prevent immediate closure
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeout)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // Calculate approximate character count based on zone dimensions
  const approximateCharCount = Math.floor((zone.width * zone.height) / (zone.fontSize * 10))

  // Position popover to stay within viewport
  const popoverStyle: React.CSSProperties = {
    position: 'fixed',
    left: position.x,
    top: position.y,
    zIndex: 1000
  }

  const handleTypeChange = (newType: Zone['type']) => {
    onUpdate({ type: newType })
  }

  const handleMinFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value > 0) {
      onUpdate({ minFontSize: value })
    }
  }

  // Stop propagation on all interactions to prevent canvas events
  const stopPropagation = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
  }

  return (
    <div
      ref={popoverRef}
      style={popoverStyle}
      className="bg-white border rounded-lg shadow-lg p-4 w-80"
      onClick={stopPropagation}
      onMouseDown={stopPropagation}
      onMouseUp={stopPropagation}
      onKeyDown={stopPropagation}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Zone Configuration</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        {/* Zone Type */}
        <div className="space-y-2">
          <Label>Zone Type</Label>
          <Select value={zone.type} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hook">Hook</SelectItem>
              <SelectItem value="body">Body</SelectItem>
              <SelectItem value="cta">CTA</SelectItem>
              <SelectItem value="no-text">No Text</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Font Size (auto-determined) */}
        <div className="space-y-2">
          <Label>Font Size (auto-determined)</Label>
          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
            {zone.fontSize}px
            {zone.type === 'hook' && ' (Headline Font)'}
            {zone.type === 'body' && ' (Body Font)'}
            {zone.type === 'cta' && ' (CTA Font)'}
          </div>
        </div>

        {/* Min Font Size */}
        {zone.type !== 'no-text' && (
          <div className="space-y-2">
            <Label htmlFor="minFontSize">Min Font Size (fallback)</Label>
            <Input
              id="minFontSize"
              type="number"
              min="8"
              max={zone.fontSize}
              value={zone.minFontSize}
              onChange={handleMinFontSizeChange}
              onClick={stopPropagation}
            />
          </div>
        )}

        {/* Approximate Character Count */}
        {zone.type !== 'no-text' && (
          <div className="space-y-2">
            <Label>Approximate Character Count</Label>
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              ~{approximateCharCount} characters
            </div>
          </div>
        )}

        {/* Zone Dimensions */}
        <div className="space-y-2">
          <Label>Dimensions</Label>
          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
            {Math.round(zone.width)} × {Math.round(zone.height)} px
            <br />
            Position: ({Math.round(zone.x)}, {Math.round(zone.y)})
          </div>
        </div>

        {/* Delete Button */}
        <Button variant="destructive" size="sm" onClick={onDelete} className="w-full">
          Delete Zone
        </Button>
      </div>
    </div>
  )
}
