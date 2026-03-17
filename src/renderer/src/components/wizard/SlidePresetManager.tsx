import { useState, useEffect } from 'react'
import { Save, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { useCreatePostStore } from '../../stores/useCreatePostStore'
import type { SlidePreset } from '../../../../shared/types/generation'

interface SlidePresetManagerProps {
  slideIndex: number
  templateId?: number
}

export function SlidePresetManager({ slideIndex, templateId }: SlidePresetManagerProps) {
  const [presets, setPresets] = useState<SlidePreset[]>([])
  const [saveName, setSaveName] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPresetId, setSelectedPresetId] = useState('')

  const loadPresets = async () => {
    try {
      const list = await window.api.presets.list()
      setPresets(list)
    } catch (err) {
      console.error('Failed to load presets:', err)
    }
  }

  useEffect(() => {
    loadPresets()
  }, [])

  const handleApplyPreset = (presetId: string) => {
    setSelectedPresetId(presetId)
    if (!presetId) return
    const preset = presets.find(p => p.id === presetId)
    if (preset) {
      useCreatePostStore.getState().applyPreset(slideIndex, preset)
    }
  }

  const handleSavePreset = async () => {
    if (!saveName.trim()) return
    setIsLoading(true)
    try {
      const slide = useCreatePostStore.getState().generatedSlides[slideIndex]
      const preset: SlidePreset = {
        id: crypto.randomUUID(),
        name: saveName.trim(),
        template_id: templateId,
        zone_overrides: slide.zone_overrides ?? {},
        overlay_opacity: slide.overlay_opacity,
        created_at: Date.now()
      }
      await window.api.presets.save(preset)
      await loadPresets()
      setSaveName('')
      setShowSaveInput(false)
    } catch (err) {
      console.error('Failed to save preset:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePreset = async (presetId: string) => {
    try {
      await window.api.presets.delete(presetId)
      if (selectedPresetId === presetId) {
        setSelectedPresetId('')
      }
      await loadPresets()
    } catch (err) {
      console.error('Failed to delete preset:', err)
    }
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-3 space-y-3">
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">Presets</div>

      {/* Apply Preset Row */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs text-slate-400 whitespace-nowrap">Apply:</span>
          <select
            value={selectedPresetId}
            onChange={(e) => handleApplyPreset(e.target.value)}
            className="flex-1 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-200 focus:border-slate-400 focus:outline-none"
          >
            <option value="" disabled>Select preset...</option>
            {presets.map(preset => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>

        {/* Delete selected preset */}
        {selectedPresetId && (
          <button
            type="button"
            onClick={() => handleDeletePreset(selectedPresetId)}
            className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
            title="Delete preset"
          >
            <Trash2 size={14} />
          </button>
        )}

        {/* Save as Preset button */}
        {!showSaveInput && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSaveInput(true)}
            className="text-xs gap-1 border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Save size={12} />
            Save as Preset
          </Button>
        )}
      </div>

      {/* Save Input Row */}
      {showSaveInput && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSavePreset()
              if (e.key === 'Escape') { setShowSaveInput(false); setSaveName('') }
            }}
            placeholder="Preset name"
            autoFocus
            className="flex-1 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none"
          />
          <Button
            size="sm"
            onClick={handleSavePreset}
            disabled={!saveName.trim() || isLoading}
            className="text-xs bg-blue-600 hover:bg-blue-700"
          >
            Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowSaveInput(false); setSaveName('') }}
            className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
