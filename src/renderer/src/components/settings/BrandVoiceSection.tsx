import type { Settings } from '../../../../shared/types/settings'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { EditableList } from './EditableList'
import { useAutoSave } from '../../hooks/useAutoSave'

interface BrandVoiceSectionProps {
  settings: Settings
  onUpdate: (section: 'brandVoice', value: Settings['brandVoice']) => Promise<void>
}

export function BrandVoiceSection({ settings, onUpdate }: BrandVoiceSectionProps) {
  const brandVoice = settings.brandVoice || {
    tonality: '',
    dos: [],
    donts: [],
    examplePosts: [],
    voiceProfile: ''
  }

  const handleFieldChange = (field: keyof NonNullable<Settings['brandVoice']>, value: any) => {
    onUpdate('brandVoice', { ...brandVoice, [field]: value })
  }

  const { saving: savingTonality } = useAutoSave(
    brandVoice.tonality,
    (value) => handleFieldChange('tonality', value),
    500
  )

  const { saving: savingVoiceProfile } = useAutoSave(
    brandVoice.voiceProfile,
    (value) => handleFieldChange('voiceProfile', value),
    500
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Brand Voice</h2>
        <p className="text-slate-400">Define how your brand sounds and communicates</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="tonality" className="text-slate-200">
            Tonality {savingTonality && <span className="text-xs text-slate-500">(saving...)</span>}
          </Label>
          <Textarea
            id="tonality"
            value={brandVoice.tonality || ''}
            onChange={(e) => handleFieldChange('tonality', e.target.value)}
            placeholder="Describe your brand voice tone (e.g., professional, casual, witty, empathetic)"
            className="mt-2 bg-slate-800 border-slate-700 text-slate-100 min-h-[100px]"
          />
        </div>

        <div>
          <Label className="text-slate-200 mb-2 block">Do's</Label>
          <EditableList
            items={brandVoice.dos || []}
            onChange={(items) => handleFieldChange('dos', items)}
            placeholder="What your brand should do"
          />
        </div>

        <div>
          <Label className="text-slate-200 mb-2 block">Don'ts</Label>
          <EditableList
            items={brandVoice.donts || []}
            onChange={(items) => handleFieldChange('donts', items)}
            placeholder="What your brand should avoid"
          />
        </div>

        <div>
          <Label className="text-slate-200 mb-2 block">Example Posts</Label>
          <EditableList
            items={brandVoice.examplePosts || []}
            onChange={(items) => handleFieldChange('examplePosts', items)}
            placeholder="Example post text that represents your brand voice"
            multiline
          />
        </div>

        <div>
          <Label htmlFor="voiceProfile" className="text-slate-200">
            Voice Profile {savingVoiceProfile && <span className="text-xs text-slate-500">(saving...)</span>}
          </Label>
          <p className="text-xs text-slate-500 mt-1 mb-2">Auto-generated description or manual override</p>
          <Textarea
            id="voiceProfile"
            value={brandVoice.voiceProfile || ''}
            onChange={(e) => handleFieldChange('voiceProfile', e.target.value)}
            placeholder="Summary of your brand's voice characteristics"
            className="mt-2 bg-slate-800 border-slate-700 text-slate-100 min-h-[100px]"
          />
        </div>
      </div>
    </div>
  )
}
