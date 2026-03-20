import type { LibraryItem } from '@shared/types'

interface ScenarioOption {
  id: string
  name: string
}

interface LibraryListEditorProps {
  title: string
  items: LibraryItem[]
  scenarios: ScenarioOption[]
  onAdd: (text: string) => void
  onRemove: (id: string) => void
  onUpdate: (id: string, updates: Partial<LibraryItem>) => void
}

export function LibraryListEditor({
  title,
  items,
  scenarios,
  onAdd,
  onRemove,
  onUpdate,
}: LibraryListEditorProps) {
  const handleAdd = () => {
    const text = window.prompt(`New ${title.slice(0, -1)} text:`)
    if (text?.trim()) onAdd(text.trim())
  }

  const toggleScenario = (item: LibraryItem, scenarioId: string) => {
    const current = item.scenarioIds ?? []
    const next = current.includes(scenarioId)
      ? current.filter(id => id !== scenarioId)
      : [...current, scenarioId]
    onUpdate(item.id, { scenarioIds: next })
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>{items.length} items</span>
          <button onClick={handleAdd} className="text-sm text-blue-600 hover:underline">+ Add</button>
        </div>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-gray-400">No {title.toLowerCase()} yet.</p>
      )}

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="flex gap-2 items-start">
              <input
                type="text"
                value={item.text}
                onChange={(e) => onUpdate(item.id, { text: e.target.value })}
                className="flex-1 border rounded px-3 py-1.5 text-sm"
              />
              <button
                onClick={() => onRemove(item.id)}
                className="text-red-400 hover:text-red-600 text-sm px-1 py-1"
              >
                Remove
              </button>
            </div>
            {scenarios.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {scenarios.map(s => {
                  const active = (item.scenarioIds ?? []).includes(s.id)
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleScenario(item, s.id)}
                      className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
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
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
