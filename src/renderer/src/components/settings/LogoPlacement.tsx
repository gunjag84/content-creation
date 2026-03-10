import React, { useState } from 'react'
import { cn } from '../../lib/utils'

type LogoPosition = 'center' | 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left'
type LogoSize = 'small' | 'medium' | 'large'

interface LogoConfig {
  path: string
  position: LogoPosition
  size: LogoSize
}

interface VisualGuidanceUpdate {
  logo?: LogoConfig
  standardCTA?: string
  instagramHandle?: string
  lastSlideRules?: string
}

interface LogoPlacementProps {
  logo: LogoConfig | undefined
  standardCTA: string | undefined
  instagramHandle: string | undefined
  lastSlideRules: string | undefined
  onUpdate: (updates: VisualGuidanceUpdate) => void
}

const LOGO_POSITIONS: { value: LogoPosition; label: string }[] = [
  { value: 'center', label: 'Center' },
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-right', label: 'Bottom Right' }
]

const LOGO_SIZES: { value: LogoSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' }
]

export function LogoPlacement({ logo, standardCTA, instagramHandle, lastSlideRules, onUpdate }: LogoPlacementProps) {
  const [ctaValue, setCtaValue] = useState(standardCTA || '')
  const [handleValue, setHandleValue] = useState(instagramHandle || '')
  const [rulesValue, setRulesValue] = useState(lastSlideRules || '')

  // Debounce timers
  const [ctaTimeout, setCtaTimeout] = useState<NodeJS.Timeout | null>(null)
  const [handleTimeout, setHandleTimeout] = useState<NodeJS.Timeout | null>(null)
  const [rulesTimeout, setRulesTimeout] = useState<NodeJS.Timeout | null>(null)

  const handleLogoUpload = async () => {
    try {
      const result = await window.api.logo.upload()
      if (result) {
        onUpdate({
          logo: {
            path: result.path,
            position: logo?.position || 'bottom-center',
            size: logo?.size || 'medium'
          }
        })
      }
    } catch (error) {
      console.error('Logo upload failed:', error)
    }
  }

  const handlePositionChange = (position: LogoPosition) => {
    if (!logo) return
    onUpdate({
      logo: {
        ...logo,
        position
      }
    })
  }

  const handleSizeChange = (size: LogoSize) => {
    if (!logo) return
    onUpdate({
      logo: {
        ...logo,
        size
      }
    })
  }

  const handleRemoveLogo = () => {
    onUpdate({ logo: undefined })
  }

  const handleCtaChange = (value: string) => {
    setCtaValue(value)
    if (ctaTimeout) clearTimeout(ctaTimeout)
    const timeout = setTimeout(() => {
      onUpdate({ standardCTA: value })
    }, 500)
    setCtaTimeout(timeout)
  }

  const handleInstagramChange = (value: string) => {
    setHandleValue(value)
    if (handleTimeout) clearTimeout(handleTimeout)
    const timeout = setTimeout(() => {
      onUpdate({ instagramHandle: value })
    }, 500)
    setHandleTimeout(timeout)
  }

  const handleRulesChange = (value: string) => {
    setRulesValue(value)
    if (rulesTimeout) clearTimeout(rulesTimeout)
    const timeout = setTimeout(() => {
      onUpdate({ lastSlideRules: value })
    }, 500)
    setRulesTimeout(timeout)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Logo Upload Section */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-gray-700">Logo</label>

        {logo ? (
          <div className="flex flex-col gap-4">
            {/* Logo preview */}
            <div className="flex items-center gap-3">
              <img
                src={`file://${logo.path}`}
                alt="Logo preview"
                className={cn(
                  'border border-gray-200 rounded-md object-contain bg-gray-50',
                  logo.size === 'small' && 'w-16 h-16',
                  logo.size === 'medium' && 'w-24 h-24',
                  logo.size === 'large' && 'w-32 h-32'
                )}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleLogoUpload}
                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Position selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-600">Position</label>
              <div className="grid grid-cols-3 gap-2">
                {LOGO_POSITIONS.map((pos) => (
                  <button
                    key={pos.value}
                    type="button"
                    onClick={() => handlePositionChange(pos.value)}
                    className={cn(
                      'px-3 py-2 text-sm rounded-md border transition-colors',
                      logo.position === pos.value
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Size selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-600">Size</label>
              <div className="flex gap-2">
                {LOGO_SIZES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => handleSizeChange(s.value)}
                    className={cn(
                      'flex-1 px-3 py-2 text-sm rounded-md border transition-colors',
                      logo.size === s.value
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleLogoUpload}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Upload Logo
            </button>
            <div className="text-xs text-gray-500">
              Supports .png, .jpg, .svg
            </div>
          </div>
        )}
      </div>

      {/* CTA Text */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Standard CTA Text</label>
        <input
          type="text"
          value={ctaValue}
          onChange={(e) => handleCtaChange(e.target.value)}
          placeholder="e.g., Hol dir dein Dankbarkeitstagebuch"
          className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Instagram Handle */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Instagram Handle</label>
        <input
          type="text"
          value={handleValue}
          onChange={(e) => handleInstagramChange(e.target.value)}
          placeholder="e.g., @leben.lieben.official"
          className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Last Slide Rules */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Last Slide Rules</label>
        <textarea
          value={rulesValue}
          onChange={(e) => handleRulesChange(e.target.value)}
          placeholder="Additional rules for the final carousel slide..."
          rows={4}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
    </div>
  )
}
