import { useEffect, useState } from 'react'

const DEFAULT_PALETTE = [
  '#FFFFFF', '#E5E5E5', '#A3A3A3', '#737373', '#404040', '#000000',
  '#EF4444', '#F97316', '#EAB308', '#F59E0B', '#D97706', '#92400E',
  '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6',
  '#EC4899', '#F43F5E', '#A855F7', '#7C3AED', '#1D4ED8', '#0F766E',
]

const STORAGE_KEY = 'content-creation-palette'
const MAX_COLORS = 24

function loadPalette(): string[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : [...DEFAULT_PALETTE]
}

function promotePalette(hex: string): string[] {
  const upper = hex.toUpperCase()
  const palette = loadPalette()
  const without = palette.filter(c => c.toUpperCase() !== upper)
  const next = [upper, ...without].slice(0, MAX_COLORS)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

interface ColorPaletteProps {
  color: string
  onChange: (color: string) => void
}

export function ColorPalette({ color, onChange }: ColorPaletteProps) {
  const [hexInput, setHexInput] = useState(color)
  const [palette, setPalette] = useState(loadPalette)

  useEffect(() => { setHexInput(color) }, [color])

  function pick(c: string) {
    setPalette(promotePalette(c))
    setHexInput(c)
    onChange(c)
  }

  return (
    <div className="space-y-2" style={{ minWidth: 172 }}>
      <div className="grid grid-cols-6 gap-1">
        {palette.map((c, i) => (
          <button
            key={`${c}-${i}`}
            type="button"
            onClick={() => pick(c)}
            className={`w-6 h-6 rounded cursor-pointer border ${
              color.toUpperCase() === c.toUpperCase() ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <input
        type="text"
        value={hexInput}
        onChange={e => {
          setHexInput(e.target.value)
          if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) pick(e.target.value)
        }}
        className="w-full border border-gray-200 rounded px-2 py-1 text-xs font-mono"
        placeholder="#000000"
      />
    </div>
  )
}
