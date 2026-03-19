import { type ReactNode } from 'react'
import * as Popover from '@radix-ui/react-popover'

function InfoPopover({ text }: { text: string }) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold text-gray-400 border border-gray-300 hover:text-blue-600 hover:border-blue-400 transition-colors leading-none"
          aria-label="More information"
        >
          i
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="right"
          align="center"
          sideOffset={8}
          className="z-50 max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-600 shadow-md"
        >
          {text}
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

interface DimensionListEditorProps<T extends { id: string }> {
  title: string
  infoText: string
  emptyMessage: string
  items: T[]
  onAdd: () => void
  onRemove: (id: string) => void
  onUpdate: (id: string, updates: Partial<T>) => void
  renderFields: (item: T, onUpdate: (updates: Partial<T>) => void) => ReactNode
}

export function DimensionListEditor<T extends { id: string }>({
  title,
  infoText,
  emptyMessage,
  items,
  onAdd,
  onRemove,
  onUpdate,
  renderFields
}: DimensionListEditorProps<T>) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h2 className="text-lg font-semibold">{title}</h2>
          <InfoPopover text={infoText} />
        </div>
        <button onClick={onAdd} className="text-sm text-blue-600 hover:underline">+ Add</button>
      </div>
      {items.length === 0 && (
        <p className="text-sm text-gray-400">{emptyMessage}</p>
      )}
      {items.map((item) => (
        <div key={item.id} className="flex gap-3 items-start">
          <div className="flex-1">
            {renderFields(item, (updates) => onUpdate(item.id, updates))}
          </div>
          <button
            onClick={() => onRemove(item.id)}
            className="text-red-400 hover:text-red-600 text-sm mt-2"
          >
            Remove
          </button>
        </div>
      ))}
    </section>
  )
}
