import React, { useEffect, useState } from 'react'
import { cn } from '../../lib/utils'

interface FontConfig {
  filename: string
  path: string
  family: string
}

interface FontUploadProps {
  label: string // "Headline Font", "Body Font", "CTA Font"
  fontConfig: FontConfig | undefined
  defaultFontSize: number // e.g., 48 for headline
  onUpload: (config: FontConfig) => void
  onRemove: () => void
}

const STANDARD_FONTS = [
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
  'Impact',
  'Comic Sans MS',
  'Palatino Linotype',
  'Lucida Console',
  'Tahoma',
  'Century Gothic',
  'Garamond',
  'Bookman Old Style',
  'Candara',
  'Calibri',
  'Cambria',
  'Segoe UI',
  'Roboto'
]

export function FontUpload({ label, fontConfig, defaultFontSize, onUpload, onRemove }: FontUploadProps) {
  const [selectedStandardFont, setSelectedStandardFont] = useState<string>('')

  // Keep dropdown in sync when switching between slots
  useEffect(() => {
    if (fontConfig && !fontConfig.path) {
      setSelectedStandardFont(fontConfig.family)
    } else {
      setSelectedStandardFont('')
    }
  }, [fontConfig?.family, fontConfig?.path])

  // Register font on component mount and whenever fontConfig changes
  useEffect(() => {
    if (!fontConfig) return

    // Skip @font-face injection for standard fonts (no path)
    if (!fontConfig.path) return

    const styleId = `font-${fontConfig.family.replace(/\s/g, '-')}`

    // Check if style already exists
    if (document.getElementById(styleId)) return

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      @font-face {
        font-family: '${fontConfig.family}';
        src: url('file://${fontConfig.path}');
      }
    `
    document.head.appendChild(style)

    return () => {
      // Cleanup on unmount
      const existingStyle = document.getElementById(styleId)
      if (existingStyle) {
        existingStyle.remove()
      }
    }
  }, [fontConfig])

  const handleStandardFontSelect = (fontName: string) => {
    setSelectedStandardFont(fontName)
    if (fontName) {
      onUpload({
        filename: fontName,
        path: '', // Empty path signals system font
        family: fontName
      })
    }
  }

  const handleUpload = async () => {
    try {
      const result = await window.api.fonts.upload()
      if (result) {
        setSelectedStandardFont('') // Clear standard font selection
        onUpload(result)
      }
    } catch (error) {
      console.error('Font upload failed:', error)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-300">{label}</label>

      {fontConfig ? (
        <div className="flex flex-col gap-3">
          {/* Standard font selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-400">Switch font:</label>
            <select
              value={selectedStandardFont}
              onChange={(e) => handleStandardFontSelect(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-700 border border-slate-600 text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a font...</option>
              {STANDARD_FONTS.map((fontName) => (
                <option key={fontName} value={fontName}>
                  {fontName}
                </option>
              ))}
            </select>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-slate-600"></div>
            <span className="text-xs text-slate-500">or</span>
            <div className="flex-1 border-t border-slate-600"></div>
          </div>

          {/* Font info and actions */}
          <div className="flex items-center gap-3">
            <div className="flex-1 text-sm text-slate-400">
              {fontConfig.filename}
            </div>
            <button
              type="button"
              onClick={handleUpload}
              className="px-3 py-1 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-md transition-colors"
            >
              Change
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="px-3 py-1 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Standard font selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-400">Choose a standard font</label>
            <select
              value={selectedStandardFont}
              onChange={(e) => handleStandardFontSelect(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-700 border border-slate-600 text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a font...</option>
              {STANDARD_FONTS.map((fontName) => (
                <option key={fontName} value={fontName}>
                  {fontName}
                </option>
              ))}
            </select>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-slate-600"></div>
            <span className="text-xs text-slate-500">or</span>
            <div className="flex-1 border-t border-slate-600"></div>
          </div>

          {/* Custom font upload */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleUpload}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Upload Custom Font
            </button>
            <div className="text-xs text-slate-500">
              Supports .ttf, .otf, .woff2
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
