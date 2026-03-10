import type { Settings } from '../../../../shared/types/settings'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { useAutoSave } from '../../hooks/useAutoSave'

interface ViralExpertiseSectionProps {
  settings: Settings
  onUpdate: (section: 'viralExpertise', value: Settings['viralExpertise']) => Promise<void>
}

export function ViralExpertiseSection({ settings, onUpdate }: ViralExpertiseSectionProps) {
  const expertise = settings.viralExpertise || { text: '' }

  const handleChange = (text: string) => {
    onUpdate('viralExpertise', { text })
  }

  const { saving } = useAutoSave(
    expertise.text || '',
    (value) => handleChange(value),
    500
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Viral Expertise</h2>
        <p className="text-slate-400">Document hook formulas and viral post structures</p>
      </div>

      <div>
        <Label htmlFor="viralExpertise" className="text-slate-200">
          Viral Post Expertise {saving && <span className="text-xs text-slate-500">(saving...)</span>}
        </Label>
        <p className="text-xs text-slate-500 mt-1 mb-2">
          Optional. Document hook formulas, viral mechanics, and post structures. When empty, this section is skipped in the AI prompt.
        </p>
        <Textarea
          id="viralExpertise"
          value={expertise.text || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Hook formulas, viral patterns, engagement triggers, proven post structures, etc."
          className="bg-slate-800 border-slate-700 text-slate-100 min-h-[200px]"
        />
      </div>
    </div>
  )
}
