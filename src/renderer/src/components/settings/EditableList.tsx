import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'

interface EditableListProps {
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
  multiline?: boolean
}

export function EditableList({ items, onChange, placeholder, multiline }: EditableListProps) {
  const handleItemChange = (index: number, value: string) => {
    const newItems = [...items]
    newItems[index] = value
    onChange(newItems)
  }

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const handleAdd = () => {
    onChange([...items, ''])
  }

  const handleBlur = (index: number) => {
    // Remove empty items on blur
    if (items[index].trim() === '') {
      handleRemove(index)
    }
  }

  const InputComponent = multiline ? Textarea : Input

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <InputComponent
            value={item}
            onChange={(e) => handleItemChange(index, e.target.value)}
            onBlur={() => handleBlur(index)}
            placeholder={placeholder}
            className="flex-1 bg-slate-800 border-slate-700 text-slate-100"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleRemove(index)}
            className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-red-900 hover:text-red-100"
          >
            X
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={handleAdd}
        className="w-full bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
      >
        + Add
      </Button>
    </div>
  )
}
