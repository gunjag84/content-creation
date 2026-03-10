import type { Settings } from '../../../../shared/types/settings'

interface StoryToolsSectionProps {
  settings: Settings
  onUpdate: (section: 'storyTools', value: Settings['storyTools']) => Promise<void>
}

export function StoryToolsSection({ settings, onUpdate }: StoryToolsSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Story Tools</h2>
        <p className="text-slate-400">Story tools catalog - Will be implemented in Plan 04</p>
      </div>
      <div className="p-8 border-2 border-dashed border-slate-700 rounded-lg text-center">
        <p className="text-slate-500">Coming soon: Catalog of Instagram Story interactive elements with engagement types and recommendations</p>
      </div>
    </div>
  )
}
