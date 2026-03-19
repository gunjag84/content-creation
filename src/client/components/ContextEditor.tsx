import { useRef, useEffect, useCallback } from 'react'

interface ContextEditorProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function AutoTextarea({ value, onChange, placeholder, className }: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const resize = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [])

  useEffect(() => { resize() }, [value, resize])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onInput={resize}
      placeholder={placeholder}
      rows={1}
      className={className ?? 'w-full border rounded-lg px-3 py-2 text-sm resize-none overflow-hidden'}
    />
  )
}

export function ContextEditor({ label, value, onChange, placeholder }: ContextEditorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <AutoTextarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  )
}
