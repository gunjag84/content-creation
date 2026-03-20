import { useState } from 'react'

interface ScenarioOption {
  id: string
  name: string
}

interface LibraryItemDialogProps {
  open: boolean
  onClose: () => void
  title: string
  initialText?: string
  scenarios: ScenarioOption[]
  initialScenarioIds?: string[]
  onSave: (text: string, scenarioIds: string[]) => void
}

export function LibraryItemDialog({
  open,
  onClose,
  title,
  initialText = '',
  scenarios,
  initialScenarioIds,
  onSave,
}: LibraryItemDialogProps) {
  const [text, setText] = useState(initialText)
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialScenarioIds ?? scenarios.map(s => s.id)
  )

  if (!open) return null

  const toggleScenario = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSave = () => {
    if (!text.trim()) return
    onSave(text.trim(), selectedIds)
    setText('')
    setSelectedIds(scenarios.map(s => s.id))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">{title}</h2>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
            autoFocus
          />
        </div>

        {scenarios.length > 0 && (
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Scenario fit</label>
            <div className="flex flex-wrap gap-1.5">
              {scenarios.map(s => {
                const active = selectedIds.includes(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleScenario(s.id)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                      active
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    {s.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!text.trim()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
