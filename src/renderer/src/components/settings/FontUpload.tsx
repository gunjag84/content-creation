import React, { useEffect } from 'react'
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

export function FontUpload({ label, fontConfig, defaultFontSize, onUpload, onRemove }: FontUploadProps) {
  // Register font on component mount and whenever fontConfig changes
  useEffect(() => {
    if (!fontConfig) return

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

  const handleUpload = async () => {
    try {
      const result = await window.api.fonts.upload()
      if (result) {
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
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleUpload}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Upload Font
          </button>
          <div className="text-xs text-gray-500">
            Supports .ttf, .otf, .woff2
          </div>
          <div className="text-sm text-gray-600 italic">
            System default (sans-serif)
          </div>
        </div>
      )}
    </div>
  )
}
