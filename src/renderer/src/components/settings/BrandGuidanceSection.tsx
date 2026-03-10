import type { Settings } from '../../../../shared/types/settings'
import { BrandColorPicker } from './BrandColorPicker'
import { FontUpload } from './FontUpload'
import { LogoPlacement } from './LogoPlacement'
import { BrandPreview } from './BrandPreview'

interface BrandGuidanceSectionProps {
  settings: Settings
  onUpdate: (section: 'visualGuidance', value: Settings['visualGuidance']) => Promise<void>
}

export function BrandGuidanceSection({ settings, onUpdate }: BrandGuidanceSectionProps) {
  const visualGuidance = settings.visualGuidance || {
    primaryColor: '#000000',
    secondaryColor: '#666666',
    backgroundColor: '#ffffff',
    headlineFontSize: 48,
    bodyFontSize: 24,
    ctaFontSize: 32,
    minFontSize: 14
  }

  const handleColorChange = (field: 'primaryColor' | 'secondaryColor' | 'backgroundColor', color: string) => {
    onUpdate('visualGuidance', { ...visualGuidance, [field]: color })
  }

  const handleFontUpload = (
    slot: 'headlineFont' | 'bodyFont' | 'ctaFont',
    config: { filename: string; path: string; family: string }
  ) => {
    onUpdate('visualGuidance', { ...visualGuidance, [slot]: config })
  }

  const handleFontRemove = (slot: 'headlineFont' | 'bodyFont' | 'ctaFont') => {
    onUpdate('visualGuidance', { ...visualGuidance, [slot]: undefined })
  }

  const handleFontSizeChange = (
    field: 'headlineFontSize' | 'bodyFontSize' | 'ctaFontSize' | 'minFontSize',
    value: number
  ) => {
    onUpdate('visualGuidance', { ...visualGuidance, [field]: value })
  }

  const handleLogoUpdate = (updates: Partial<NonNullable<Settings['visualGuidance']>>) => {
    onUpdate('visualGuidance', { ...visualGuidance, ...updates })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Brand Guidance</h2>
        <p className="text-slate-400">
          Define your visual identity: colors, typography, logo, and CTA text
        </p>
      </div>

      <div className="grid grid-cols-[1fr_400px] gap-8">
        {/* Left column: Controls */}
        <div className="space-y-8 bg-white rounded-lg p-6 border border-gray-200">
          {/* Colors Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Colors</h3>
            <div className="flex gap-6">
              <BrandColorPicker
                label="Primary Color"
                color={visualGuidance.primaryColor}
                onChange={(color) => handleColorChange('primaryColor', color)}
              />
              <BrandColorPicker
                label="Secondary Color"
                color={visualGuidance.secondaryColor}
                onChange={(color) => handleColorChange('secondaryColor', color)}
              />
              <BrandColorPicker
                label="Background Color"
                color={visualGuidance.backgroundColor}
                onChange={(color) => handleColorChange('backgroundColor', color)}
              />
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-gray-200" />

          {/* Typography Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Typography</h3>
            <div className="space-y-6">
              <FontUpload
                label="Headline Font"
                fontConfig={visualGuidance.headlineFont}
                defaultFontSize={visualGuidance.headlineFontSize}
                onUpload={(config) => handleFontUpload('headlineFont', config)}
                onRemove={() => handleFontRemove('headlineFont')}
              />
              <FontUpload
                label="Body Font"
                fontConfig={visualGuidance.bodyFont}
                defaultFontSize={visualGuidance.bodyFontSize}
                onUpload={(config) => handleFontUpload('bodyFont', config)}
                onRemove={() => handleFontRemove('bodyFont')}
              />
              <FontUpload
                label="CTA Font"
                fontConfig={visualGuidance.ctaFont}
                defaultFontSize={visualGuidance.ctaFontSize}
                onUpload={(config) => handleFontUpload('ctaFont', config)}
                onRemove={() => handleFontRemove('ctaFont')}
              />

              {/* Font Sizes */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Headline Size (px)</label>
                  <input
                    type="number"
                    value={visualGuidance.headlineFontSize}
                    onChange={(e) => handleFontSizeChange('headlineFontSize', parseInt(e.target.value) || 48)}
                    min={14}
                    max={120}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Body Size (px)</label>
                  <input
                    type="number"
                    value={visualGuidance.bodyFontSize}
                    onChange={(e) => handleFontSizeChange('bodyFontSize', parseInt(e.target.value) || 24)}
                    min={14}
                    max={80}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">CTA Size (px)</label>
                  <input
                    type="number"
                    value={visualGuidance.ctaFontSize}
                    onChange={(e) => handleFontSizeChange('ctaFontSize', parseInt(e.target.value) || 32)}
                    min={14}
                    max={80}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Min Size (px)</label>
                  <input
                    type="number"
                    value={visualGuidance.minFontSize}
                    onChange={(e) => handleFontSizeChange('minFontSize', parseInt(e.target.value) || 14)}
                    min={10}
                    max={24}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-gray-200" />

          {/* Logo & CTA Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Logo & CTA</h3>
            <LogoPlacement
              logo={visualGuidance.logo}
              standardCTA={visualGuidance.standardCTA}
              instagramHandle={visualGuidance.instagramHandle}
              lastSlideRules={visualGuidance.lastSlideRules}
              onUpdate={handleLogoUpdate}
            />
          </div>
        </div>

        {/* Right column: Live Preview */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 sticky top-6">
          <BrandPreview visualGuidance={visualGuidance} />
        </div>
      </div>
    </div>
  )
}
