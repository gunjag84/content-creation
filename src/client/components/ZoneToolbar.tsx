import { useEffect, useRef, useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import type { ZoneOverride, FontLibraryEntry } from '@shared/types'
import { FONT_OPTIONS } from '@shared/fontOptions'
import { toHex } from '@shared/colorUtils'

interface ZoneToolbarProps {
  // Fully resolved values (settings defaults + overrides) — never undefined for visual fields
  values: ZoneOverride
  onChange: (o: ZoneOverride) => void
  fontLibrary?: FontLibraryEntry[]
}

const BTN = 'flex items-center justify-center w-7 h-7 rounded text-sm font-medium transition-colors'
const BTN_ACTIVE = 'bg-blue-600 text-white'
const BTN_INACTIVE = 'border border-gray-200 text-gray-700 hover:bg-gray-100'

export function ZoneToolbar({ values, onChange, fontLibrary }: ZoneToolbarProps) {
  const customFonts = fontLibrary?.length
    ? fontLibrary.map(f => ({ label: f.name, value: f.name, isCustom: true }))
    : []
  const [showColor, setShowColor] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const colorRef = useRef<HTMLDivElement>(null)

  // Close color picker on outside click
  useEffect(() => {
    if (!showColor) return
    function handleDocMouseDown(e: MouseEvent) {
      if (!colorRef.current?.contains(e.target as Node)) {
        setShowColor(false)
      }
    }
    document.addEventListener('mousedown', handleDocMouseDown)
    return () => document.removeEventListener('mousedown', handleDocMouseDown)
  }, [showColor])

  const isBold = values.fontWeight === 'bold' || values.fontWeight === '700'
  const isItalic = values.fontStyle === 'italic'
  const fontSize = values.fontSize ?? 56
  const align = values.textAlign ?? 'center'
  const color = toHex(values.color ?? '#000000')
  const lineHeight = values.lineHeight ?? 1.3
  const letterSpacing = values.letterSpacing ?? 0

  // hexInput is local state for typing partial hex values.
  // Sync from prop when zone switches (color prop changes externally).
  const [hexInput, setHexInput] = useState(color)
  useEffect(() => { setHexInput(color) }, [color])

  function toggle(key: 'bold' | 'italic') {
    if (key === 'bold') {
      onChange({ ...values, fontWeight: isBold ? 'normal' : 'bold' })
    } else {
      onChange({ ...values, fontStyle: isItalic ? 'normal' : 'italic' })
    }
  }

  function setAlign(a: 'left' | 'center' | 'right') {
    onChange({ ...values, textAlign: a })
  }

  function setFontSize(n: number) {
    const clamped = Math.max(8, Math.min(200, n))
    onChange({ ...values, fontSize: clamped })
  }

  function applyColor(c: string) {
    setHexInput(c)
    onChange({ ...values, color: c })
  }

  return (
    <div className="space-y-2">
      {/* Primary row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Bold */}
        <button
          type="button"
          aria-label="Bold"
          onClick={() => toggle('bold')}
          className={`${BTN} ${isBold ? BTN_ACTIVE : BTN_INACTIVE} font-bold`}
        >
          B
        </button>

        {/* Italic */}
        <button
          type="button"
          aria-label="Italic"
          onClick={() => toggle('italic')}
          className={`${BTN} ${isItalic ? BTN_ACTIVE : BTN_INACTIVE} italic`}
        >
          I
        </button>

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        {/* Alignment */}
        {(['left', 'center', 'right'] as const).map(a => (
          <button
            key={a}
            type="button"
            aria-label={`Align ${a}`}
            onClick={() => setAlign(a)}
            className={`${BTN} ${align === a ? BTN_ACTIVE : BTN_INACTIVE} text-xs`}
          >
            {a === 'left' ? '⬅' : a === 'center' ? '↔' : '➡'}
          </button>
        ))}

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        {/* Font size */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Decrease font size"
            onClick={() => setFontSize(fontSize - 2)}
            className={`${BTN} ${BTN_INACTIVE} text-base leading-none`}
          >
            −
          </button>
          <input
            type="number"
            value={fontSize}
            min={8}
            max={200}
            onChange={e => setFontSize(parseInt(e.target.value) || fontSize)}
            className="w-12 h-7 text-center text-sm border border-gray-200 rounded"
          />
          <button
            type="button"
            aria-label="Increase font size"
            onClick={() => setFontSize(fontSize + 2)}
            className={`${BTN} ${BTN_INACTIVE} text-base leading-none`}
          >
            +
          </button>
        </div>

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        {/* Color swatch */}
        <div className="relative" ref={colorRef}>
          <button
            type="button"
            aria-label="Text color"
            onClick={() => setShowColor(v => !v)}
            className="w-7 h-7 rounded border border-gray-200 cursor-pointer"
            style={{ backgroundColor: color }}
          />
          {showColor && (
            <div
              className="absolute z-50 top-9 left-0 bg-white border border-gray-200 rounded-lg shadow-md p-3 space-y-2"
              tabIndex={-1}
            >
              <HexColorPicker color={color} onChange={applyColor} />
              <input
                type="text"
                value={hexInput}
                onChange={e => {
                  setHexInput(e.target.value)
                  if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) applyColor(e.target.value)
                }}
                className="w-full border border-gray-200 rounded px-2 py-1 text-xs font-mono"
                placeholder="#000000"
              />
            </div>
          )}
        </div>
      </div>

      {/* Font family — zone-level default */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 shrink-0">Font</label>
        <select
          aria-label="Font family"
          value={values.fontFamily ?? ''}
          onChange={e => onChange({ ...values, fontFamily: e.target.value || undefined })}
          className="flex-1 text-xs border border-gray-200 rounded px-2 py-1"
        >
          {FONT_OPTIONS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
          {customFonts.length > 0 && (
            <optgroup label="Custom Fonts">
              {customFonts.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* Advanced toggle */}
      <div>
        <button
          type="button"
          aria-label="Advanced formatting"
          onClick={() => setShowAdvanced(v => !v)}
          className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
        >
          <span>{showAdvanced ? '▼' : '▶'}</span>
          Advanced
        </button>

        {showAdvanced && (
          <div className="mt-2 space-y-2 pl-1">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 w-24 shrink-0">Line height</label>
              <input
                type="range"
                min={0.8}
                max={2.5}
                step={0.1}
                value={lineHeight}
                onChange={e => onChange({ ...values, lineHeight: parseFloat(e.target.value) })}
                className="flex-1"
              />
              <span className="text-xs text-gray-500 w-8 text-right">{lineHeight.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 w-24 shrink-0">Letter spacing</label>
              <input
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={letterSpacing}
                onChange={e => onChange({ ...values, letterSpacing: parseFloat(e.target.value) })}
                className="flex-1"
              />
              <span className="text-xs text-gray-500 w-8 text-right">{letterSpacing}px</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
