import React, { useState, useRef, useEffect } from 'react'
import { HexColorPicker, HexColorInput } from 'react-colorful'
import { cn } from '../../lib/utils'

interface BrandColorPickerProps {
  label: string
  color: string
  onChange: (color: string) => void
}

export function BrandColorPicker({ label, color, onChange }: BrandColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close popover when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        buttonRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-3 relative">
        {/* Color swatch button */}
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-12 h-12 rounded-md border-2 border-gray-300 cursor-pointer hover:border-gray-400 transition-colors shadow-sm"
          style={{ backgroundColor: color }}
          title={`Pick ${label.toLowerCase()}`}
        />

        {/* Hex input */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">#</span>
          <HexColorInput
            color={color}
            onChange={onChange}
            prefixed={false}
            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Color picker popover */}
        {isOpen && (
          <div
            ref={popoverRef}
            className="absolute top-14 left-0 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-3"
          >
            <HexColorPicker color={color} onChange={onChange} />
          </div>
        )}
      </div>
    </div>
  )
}
