import type { Settings } from '../../../../shared/types/settings'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { EditableList } from './EditableList'
import { useAutoSave } from '../../hooks/useAutoSave'

interface PersonaSectionProps {
  settings: Settings
  onUpdate: (section: 'targetPersona', value: Settings['targetPersona']) => Promise<void>
}

export function PersonaSection({ settings, onUpdate }: PersonaSectionProps) {
  const persona = settings.targetPersona || {
    name: '',
    demographics: '',
    painPoints: [],
    goals: [],
    languageExpectations: '',
    mediaConsumption: '',
    buyingBehavior: ''
  }

  const handleFieldChange = (field: keyof NonNullable<Settings['targetPersona']>, value: any) => {
    onUpdate('targetPersona', { ...persona, [field]: value })
  }

  const { saving: savingName } = useAutoSave(
    persona.name,
    (value) => handleFieldChange('name', value),
    500
  )

  const { saving: savingDemo } = useAutoSave(
    persona.demographics,
    (value) => handleFieldChange('demographics', value),
    500
  )

  const { saving: savingLang } = useAutoSave(
    persona.languageExpectations,
    (value) => handleFieldChange('languageExpectations', value),
    500
  )

  const { saving: savingMedia } = useAutoSave(
    persona.mediaConsumption,
    (value) => handleFieldChange('mediaConsumption', value),
    500
  )

  const { saving: savingBuying } = useAutoSave(
    persona.buyingBehavior,
    (value) => handleFieldChange('buyingBehavior', value),
    500
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Target Persona</h2>
        <p className="text-slate-400">Define who your content is designed for</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-slate-200">
            Persona Name {savingName && <span className="text-xs text-slate-500">(saving...)</span>}
          </Label>
          <Input
            id="name"
            value={persona.name || ''}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            placeholder="e.g., Sarah"
            className="mt-2 bg-slate-800 border-slate-700 text-slate-100"
          />
        </div>

        <div>
          <Label htmlFor="demographics" className="text-slate-200">
            Demographics {savingDemo && <span className="text-xs text-slate-500">(saving...)</span>}
          </Label>
          <Textarea
            id="demographics"
            value={persona.demographics || ''}
            onChange={(e) => handleFieldChange('demographics', e.target.value)}
            placeholder="Age, location, profession, education, income, etc."
            className="mt-2 bg-slate-800 border-slate-700 text-slate-100 min-h-[80px]"
          />
        </div>

        <div>
          <Label className="text-slate-200 mb-2 block">Pain Points</Label>
          <EditableList
            items={persona.painPoints || []}
            onChange={(items) => handleFieldChange('painPoints', items)}
            placeholder="What problems or frustrations does this persona face?"
          />
        </div>

        <div>
          <Label className="text-slate-200 mb-2 block">Goals</Label>
          <EditableList
            items={persona.goals || []}
            onChange={(items) => handleFieldChange('goals', items)}
            placeholder="What is this persona trying to achieve?"
          />
        </div>

        <div>
          <Label htmlFor="languageExpectations" className="text-slate-200">
            Language Expectations {savingLang && <span className="text-xs text-slate-500">(saving...)</span>}
          </Label>
          <Textarea
            id="languageExpectations"
            value={persona.languageExpectations || ''}
            onChange={(e) => handleFieldChange('languageExpectations', e.target.value)}
            placeholder="How does this persona prefer to communicate? Formal vs casual, jargon level, etc."
            className="mt-2 bg-slate-800 border-slate-700 text-slate-100 min-h-[80px]"
          />
        </div>

        <div>
          <Label htmlFor="mediaConsumption" className="text-slate-200">
            Media Consumption {savingMedia && <span className="text-xs text-slate-500">(saving...)</span>}
          </Label>
          <Textarea
            id="mediaConsumption"
            value={persona.mediaConsumption || ''}
            onChange={(e) => handleFieldChange('mediaConsumption', e.target.value)}
            placeholder="What platforms, formats, and content types does this persona engage with?"
            className="mt-2 bg-slate-800 border-slate-700 text-slate-100 min-h-[80px]"
          />
        </div>

        <div>
          <Label htmlFor="buyingBehavior" className="text-slate-200">
            Buying Behavior {savingBuying && <span className="text-xs text-slate-500">(saving...)</span>}
          </Label>
          <Textarea
            id="buyingBehavior"
            value={persona.buyingBehavior || ''}
            onChange={(e) => handleFieldChange('buyingBehavior', e.target.value)}
            placeholder="How does this persona make purchasing decisions? What influences them?"
            className="mt-2 bg-slate-800 border-slate-700 text-slate-100 min-h-[80px]"
          />
        </div>
      </div>
    </div>
  )
}
