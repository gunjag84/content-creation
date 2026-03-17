import { useEffect, useRef, useState } from 'react'

interface UseAutoSaveReturn {
  saving: boolean
  lastSaved: Date | null
}

/**
 * Auto-save hook with debouncing
 * @param value - The value to save
 * @param onSave - Callback to save the value
 * @param delay - Debounce delay in milliseconds (default: 500ms, pass 0 for immediate)
 */
export function useAutoSave<T>(
  value: T,
  onSave: (value: T) => void | Promise<void>,
  delay: number = 500
): UseAutoSaveReturn {
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const initializedRef = useRef(false)
  const valueRef = useRef(value)
  const onSaveRef = useRef(onSave)

  // Keep onSave ref current without triggering effect
  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  useEffect(() => {
    // Skip save on initial mount
    if (!initializedRef.current) {
      initializedRef.current = true
      valueRef.current = value
      return
    }

    // Skip if value hasn't changed
    if (valueRef.current === value) {
      return
    }

    valueRef.current = value

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(
      async () => {
        setSaving(true)
        try {
          await onSaveRef.current(value)
          setLastSaved(new Date())
        } catch (err) {
          console.error('Auto-save failed:', err)
        } finally {
          setSaving(false)
        }
      },
      delay
    )

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, delay])

  return { saving, lastSaved }
}
