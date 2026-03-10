import type { Settings } from '../../../../shared/types/settings'

interface MechanicsSectionProps {
  settings: Settings
  onUpdate: (section: 'mechanics', value: Settings['mechanics']) => Promise<void>
}

export function MechanicsSection({ settings, onUpdate }: MechanicsSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Post Mechanics</h2>
        <p className="text-slate-400">Mechanics catalog - Will be implemented in Plan 04</p>
      </div>
      <div className="p-8 border-2 border-dashed border-slate-700 rounded-lg text-center">
        <p className="text-slate-500">Coming soon: Catalog of post mechanics with hook rules, slide ranges, and structure guidelines</p>
      </div>
    </div>
  )
}
