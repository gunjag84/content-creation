import React, { useState } from 'react'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

interface BackgroundSelectorProps {
  backgroundType: 'image' | 'solid_color' | 'gradient'
  backgroundValue: string
  brandColors: {
    primaryColor: string
    secondaryColor: string
    backgroundColor: string
  }
  onTypeChange: (type: 'image' | 'solid_color' | 'gradient', value: string) => void
  onImageUpload: () => Promise<string | null>
}

export function BackgroundSelector({
  backgroundType,
  backgroundValue,
  brandColors,
  onTypeChange,
  onImageUpload
}: BackgroundSelectorProps) {
  const [uploading, setUploading] = useState(false)

  const handleImageUpload = async () => {
    setUploading(true)
    try {
      const imagePath = await onImageUpload()
      if (imagePath) {
        onTypeChange('image', imagePath)
      }
    } finally {
      setUploading(false)
    }
  }

  const handleColorSelect = (color: string) => {
    onTypeChange('solid_color', color)
  }

  const handleGradientDirectionChange = (direction: string) => {
    // Create gradient CSS value using brand colors
    const gradientValue = `${brandColors.primaryColor},${brandColors.secondaryColor},${direction}`
    onTypeChange('gradient', gradientValue)
  }

  // Parse gradient if current type is gradient
  const currentGradientDirection =
    backgroundType === 'gradient' ? backgroundValue.split(',')[2] || 'vertical' : 'vertical'

  return (
    <div className="space-y-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
      <h3 className="font-semibold text-sm text-slate-200">Background</h3>

      {/* Background Type Radio Group */}
      <div className="space-y-2">
        <Label className="text-slate-300">Background Type</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={backgroundType === 'image' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              if (backgroundType !== 'image' && backgroundValue) {
                // Keep existing value if switching back
                onTypeChange('image', backgroundValue)
              }
            }}
          >
            Image
          </Button>
          <Button
            type="button"
            variant={backgroundType === 'solid_color' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTypeChange('solid_color', brandColors.backgroundColor)}
          >
            Solid Color
          </Button>
          <Button
            type="button"
            variant={backgroundType === 'gradient' ? 'default' : 'outline'}
            size="sm"
            onClick={() =>
              onTypeChange(
                'gradient',
                `${brandColors.primaryColor},${brandColors.secondaryColor},vertical`
              )
            }
          >
            Gradient
          </Button>
        </div>
      </div>

      {/* Image Upload */}
      {backgroundType === 'image' && (
        <div className="space-y-2">
          {backgroundValue ? (
            <div className="space-y-2">
              <div className="aspect-[4/5] w-full max-w-[200px] rounded-lg border overflow-hidden bg-slate-700">
                <img
                  src={`file://${backgroundValue}`}
                  alt="Background preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback for preview errors
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleImageUpload}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Change Image'}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={handleImageUpload}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Image'}
            </Button>
          )}
        </div>
      )}

      {/* Solid Color Swatches */}
      {backgroundType === 'solid_color' && (
        <div className="space-y-2">
          <Label className="text-slate-300">Select Color</Label>
          <div className="flex gap-2">
            {/* Brand color swatches */}
            <button
              type="button"
              onClick={() => handleColorSelect(brandColors.primaryColor)}
              className={`w-12 h-12 rounded-md border-2 ${
                backgroundValue === brandColors.primaryColor
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-slate-600'
              } cursor-pointer hover:border-gray-400 transition-colors shadow-sm`}
              style={{ backgroundColor: brandColors.primaryColor }}
              title="Primary Color"
            />
            <button
              type="button"
              onClick={() => handleColorSelect(brandColors.secondaryColor)}
              className={`w-12 h-12 rounded-md border-2 ${
                backgroundValue === brandColors.secondaryColor
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-slate-600'
              } cursor-pointer hover:border-gray-400 transition-colors shadow-sm`}
              style={{ backgroundColor: brandColors.secondaryColor }}
              title="Secondary Color"
            />
            <button
              type="button"
              onClick={() => handleColorSelect(brandColors.backgroundColor)}
              className={`w-12 h-12 rounded-md border-2 ${
                backgroundValue === brandColors.backgroundColor
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-slate-600'
              } cursor-pointer hover:border-gray-400 transition-colors shadow-sm`}
              style={{ backgroundColor: brandColors.backgroundColor }}
              title="Background Color"
            />
          </div>

          {/* Custom hex input */}
          <div className="space-y-2">
            <Label htmlFor="custom-color" className="text-slate-300">Custom Color</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">#</span>
              <Input
                id="custom-color"
                type="text"
                value={backgroundValue.replace('#', '')}
                onChange={(e) => {
                  const color = e.target.value.replace('#', '')
                  if (/^[0-9A-Fa-f]{0,6}$/.test(color)) {
                    handleColorSelect(`#${color}`)
                  }
                }}
                maxLength={6}
                className="w-28 bg-slate-700 border-slate-600 text-slate-100"
                placeholder="000000"
              />
            </div>
          </div>
        </div>
      )}

      {/* Gradient Options */}
      {backgroundType === 'gradient' && (
        <div className="space-y-2">
          <Label className="text-slate-300">Gradient Direction</Label>
          <div className="flex gap-2">
            {(['vertical', 'horizontal', 'diagonal'] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => handleGradientDirectionChange(dir)}
                className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                  currentGradientDirection === dir
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                }`}
              >
                {dir === 'vertical' ? 'Top to Bottom' : dir === 'horizontal' ? 'Left to Right' : 'Diagonal'}
              </button>
            ))}
          </div>

          {/* Gradient Preview */}
          <div className="space-y-2">
            <Label className="text-slate-300">Preview</Label>
            <div
              className="w-full h-20 rounded-md border"
              style={{
                background:
                  currentGradientDirection === 'vertical'
                    ? `linear-gradient(to bottom, ${brandColors.primaryColor}, ${brandColors.secondaryColor})`
                    : currentGradientDirection === 'horizontal'
                      ? `linear-gradient(to right, ${brandColors.primaryColor}, ${brandColors.secondaryColor})`
                      : `linear-gradient(135deg, ${brandColors.primaryColor}, ${brandColors.secondaryColor})`
              }}
            />
          </div>
          <p className="text-xs text-slate-500">
            Uses brand primary and secondary colors
          </p>
        </div>
      )}
    </div>
  )
}
