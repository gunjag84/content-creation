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
      <label className="text-sm font-medium text-gray-700">{label}</label>

      {fontConfig ? (
        <div className="flex flex-col gap-3">
          {/* Font info and actions */}
          <div className="flex items-center gap-3">
            <div className="flex-1 text-sm text-gray-600">
              {fontConfig.filename}
            </div>
            <button
              type="button"
              onClick={handleUpload}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
            >
              Change
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            >
              Remove
            </button>
          </div>

          {/* Font preview */}
          <div
            className="p-4 bg-gray-50 rounded-md border border-gray-200"
            style={{
              fontFamily: `'${fontConfig.family}', sans-serif`,
              fontSize: `${defaultFontSize}px`,
              lineHeight: '1.2'
            }}
          >
            The quick brown fox jumps over the lazy dog
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Standard font selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-600">Choose a standard font</label>
            <select
              value={selectedStandardFont}
              onChange={(e) => handleStandardFontSelect(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="text-xs text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-300"></div>
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
            <div className="text-xs text-gray-500">
              Supports .ttf, .otf, .woff2
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
