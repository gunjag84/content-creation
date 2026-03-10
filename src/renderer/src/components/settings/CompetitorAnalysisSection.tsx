import type { Settings } from '../../../../shared/types/settings'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { useAutoSave } from '../../hooks/useAutoSave'

interface CompetitorAnalysisSectionProps {
  settings: Settings
  onUpdate: (section: 'competitorAnalysis', value: Settings['competitorAnalysis']) => Promise<void>
}

export function CompetitorAnalysisSection({ settings, onUpdate }: CompetitorAnalysisSectionProps) {
  const analysis = settings.competitorAnalysis || { text: '' }

  const handleChange = (text: string) => {
    onUpdate('competitorAnalysis', { text })
  }

  const { saving } = useAutoSave(
    analysis.text || '',
    (value) => handleChange(value),
    500
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Competitor Analysis</h2>
        <p className="text-slate-400">Describe how your brand differs from competitors</p>
      </div>

      <div>
        <Label htmlFor="competitorAnalysis" className="text-slate-200">
          Competitor Analysis & Differentiation {saving && <span className="text-xs text-slate-500">(saving...)</span>}
        </Label>
        <p className="text-xs text-slate-500 mt-1 mb-2">
          Optional. Describe how your brand differs from competitors. When empty, this section is skipped in the AI prompt.
        </p>
        <Textarea
          id="competitorAnalysis"
          value={analysis.text || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="What makes your brand unique compared to competitors? What do they do that you avoid? What gaps do you fill?"
          className="bg-slate-800 border-slate-700 text-slate-100 min-h-[200px]"
        />
      </div>
    </div>
  )
}
