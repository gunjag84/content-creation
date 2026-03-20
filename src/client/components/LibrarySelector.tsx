import { useState } from 'react'
import type { LibraryItem } from '@shared/types'
import { LibraryItemDialog } from './LibraryItemDialog'

interface ScenarioOption {
  id: string
  name: string
}

interface LibrarySelectorProps {
  items: LibraryItem[]
  currentText: string
  currentItemId: string | null
  scenarioId: string
  scenarios: ScenarioOption[]
  onSelect: (item: LibraryItem) => void
  onAddToLibrary: (text: string, scenarioIds: string[]) => void
  label: string
}

export function LibrarySelector({
  items,
  currentText,
  currentItemId,
  scenarioId,
  scenarios,
  onSelect,
  onAddToLibrary,
  label,
}: LibrarySelectorProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)

  // Filter by scenario match, exclude current
  const alternatives = items.filter(item => {
    if (item.id === currentItemId) return false
    if (item.scenarioIds.length === 0) return true
    return item.scenarioIds.includes(scenarioId)
  })

  if (items.length === 0) return null

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400 uppercase tracking-wide">{label} Library</span>
        <button
          type="button"
          onClick={() => setShowAddDialog(true)}
          className="text-[10px] text-blue-600 hover:underline"
        >
          + New
        </button>
      </div>

      {alternatives.length > 0 ? (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {alternatives.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              title={item.text}
              className="flex-shrink-0 max-w-[200px] px-2 py-1 text-xs bg-gray-100 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 hover:border-blue-300 rounded-lg truncate transition-colors"
            >
              {item.text}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-gray-300">No alternatives for this scenario</p>
      )}

      <LibraryItemDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        title={`Add ${label}`}
        scenarios={scenarios}
        onSave={onAddToLibrary}
      />
    </div>
  )
}
