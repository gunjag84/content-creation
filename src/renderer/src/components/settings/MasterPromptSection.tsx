import { useState } from 'react'
import type { Settings } from '../../../../shared/types/settings'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { useAutoSave } from '../../hooks/useAutoSave'
import { DEFAULT_MASTER_PROMPT } from '../../../../main/data/master-prompt-default'

interface MasterPromptSectionProps {
  settings: Settings
  onUpdate: (section: 'masterPrompt', value: Settings['masterPrompt']) => Promise<void>
}

export function MasterPromptSection({ settings, onUpdate }: MasterPromptSectionProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const prompt = settings.masterPrompt

  const handleChange = (template: string) => {
    onUpdate('masterPrompt', { template })
  }

  const handleReset = () => {
    handleChange(DEFAULT_MASTER_PROMPT)
    setShowResetConfirm(false)
  }

  const { saving } = useAutoSave(
    prompt.template,
    (value) => handleChange(value),
    500
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Master Prompt Template</h2>
        <p className="text-slate-400">The prompt template used for AI content generation</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="masterPrompt" className="text-slate-200">
            Prompt Template {saving && <span className="text-xs text-slate-500">(saving...)</span>}
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowResetConfirm(true)}
            className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
          >
            Reset to Default
          </Button>
        </div>
        <p className="text-xs text-slate-500 mb-2">
          The prompt template used for AI content generation. Rarely needs editing.
        </p>
        <Textarea
          id="masterPrompt"
          value={prompt.template}
          onChange={(e) => handleChange(e.target.value)}
          className="bg-slate-800 border-slate-700 text-slate-100 font-mono text-sm min-h-[400px]"
        />
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md">
            <h3 className="text-xl font-bold text-slate-100 mb-4">Confirm Reset</h3>
            <p className="text-slate-300 mb-6">
              Are you sure? This will replace your custom prompt with the default template.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowResetConfirm(false)}
                className="bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReset}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Reset to Default
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
