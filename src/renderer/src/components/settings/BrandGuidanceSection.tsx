import type { Settings } from '../../../../shared/types/settings'

interface BrandGuidanceSectionProps {
  settings: Settings
  onUpdate: (section: 'visualGuidance', value: Settings['visualGuidance']) => Promise<void>
}

export function BrandGuidanceSection({ settings, onUpdate }: BrandGuidanceSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Brand Guidance</h2>
        <p className="text-slate-400">Visual brand elements - Will be implemented in Plan 05</p>
      </div>
      <div className="p-8 border-2 border-dashed border-slate-700 rounded-lg text-center">
        <p className="text-slate-500">Coming soon: Color pickers, font management, logo upload, and CTA configuration</p>
      </div>
    </div>
  )
}
