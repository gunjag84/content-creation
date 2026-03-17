interface ContextEditorProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function ContextEditor({ label, value, onChange, placeholder }: ContextEditorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={6}
        className="w-full border rounded-lg px-3 py-2 text-sm resize-y"
      />
    </div>
  )
}
