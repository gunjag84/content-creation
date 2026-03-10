import type { Settings } from '../../../../shared/types/settings'

interface ThemeSectionProps {
  settings: Settings
  onUpdate: (section: 'themes', value: Settings['themes']) => Promise<void>
}

export function ThemeSection({ settings, onUpdate }: ThemeSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Themes</h2>
        <p className="text-slate-400">Theme hierarchy display - Will be implemented in Plan 03</p>
      </div>
      <div className="p-8 border-2 border-dashed border-slate-700 rounded-lg text-center">
        <p className="text-slate-500">Coming soon: Hierarchical display of Oberthemen → Unterthemen → Kernaussagen with active/inactive toggles</p>
      </div>
    </div>
  )
}
