import { useEffect, useState } from 'react'
import { useWizardStore } from '../stores/wizardStore'
import { useSettingsStore } from '../stores/settingsStore'
import { api } from '../lib/apiClient'
import type { BalanceRecommendation, BalanceWarning, GenerationResult } from '@shared/types'

interface CreatePostProps {
  onGenerated: () => void
}

export function CreatePost({ onGenerated }: CreatePostProps) {
  const store = useWizardStore()
  const { settings, load: loadSettings } = useSettingsStore()
  const [mode, setMode] = useState<'ai' | 'manual'>('ai')

  useEffect(() => {
    loadSettings()
    // Load recommendation
    api.get<{ recommendation: BalanceRecommendation | null; warnings: BalanceWarning[] }>('/posts/meta/recommendation')
      .then(({ recommendation, warnings }) => {
        if (recommendation) store.setRecommendation(recommendation, warnings)
      })
      .catch(() => {})
  }, [])

  // Auto-select first item in each dropdown when settings load (if nothing selected yet)
  useEffect(() => {
    if (!settings) return
    if (!store.selectedPillar && settings.pillars.length > 0) {
      store.setField('selectedPillar', settings.pillars[0].name)
    }
    if (!store.selectedTheme && settings.themes.length > 0) {
      store.setField('selectedTheme', settings.themes[0].name)
    }
    if (!store.selectedMechanic && settings.mechanics.length > 0) {
      store.setField('selectedMechanic', settings.mechanics[0].name)
    }
  }, [settings])

  const canGenerate = store.selectedPillar && store.selectedTheme && store.selectedMechanic

  const handleGenerate = () => {
    store.setIsGenerating(true)
    store.setGenerationError(null)

    const cancel = api.streamGenerate(
      {
        pillar: store.selectedPillar,
        theme: store.selectedTheme,
        mechanic: store.selectedMechanic,
        contentType: store.contentType,
        impulse: store.impulse
      },
      (text) => store.appendStreamText(text),
      (result) => {
        store.setGenerationComplete(result as GenerationResult, settings?.visual?.cta)
        onGenerated()
      },
      (msg) => store.setGenerationError(msg)
    )

    // Store cancel function for potential disconnect
    return cancel
  }

  const handleManual = () => {
    store.initManualSlides(store.contentType, settings?.visual?.cta)
    onGenerated()
  }

  const pillars = settings?.pillars ?? []
  const themes = settings?.themes ?? []
  const mechanics = settings?.mechanics ?? []

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Create Post</h1>

      {/* Recommendation badge */}
      {store.recommendation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <span className="font-medium text-blue-700">Recommendation:</span>{' '}
          {store.recommendation.pillar} / {store.recommendation.theme} / {store.recommendation.mechanic}
        </div>
      )}

      {/* Warnings */}
      {store.warnings.length > 0 && (
        <div className="space-y-1">
          {store.warnings.map((w, i) => (
            <div key={i} className="text-xs text-amber-600 bg-amber-50 rounded px-3 py-1">{w.message}</div>
          ))}
        </div>
      )}

      {/* Content type toggle */}
      <div className="flex gap-2">
        {(['single', 'carousel'] as const).map((type) => (
          <button
            key={type}
            onClick={() => store.setField('contentType', type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              store.contentType === type ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {type === 'single' ? 'Single Post' : 'Carousel'}
          </button>
        ))}
      </div>

      {/* Dropdowns */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pillar</label>
          <select
            value={store.selectedPillar}
            onChange={(e) => store.setField('selectedPillar', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            {pillars.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
          <select
            value={store.selectedTheme}
            onChange={(e) => store.setField('selectedTheme', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            {themes.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mechanic</label>
          <select
            value={store.selectedMechanic}
            onChange={(e) => store.setField('selectedMechanic', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            {mechanics.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
          </select>
        </div>
      </div>

      {/* Impulse */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Impulse (optional)</label>
        <textarea
          value={store.impulse}
          onChange={(e) => store.setField('impulse', e.target.value)}
          rows={3}
          className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
          placeholder="Additional guidance for this post..."
        />
      </div>

      {/* Mode switch + actions */}
      <div className="flex gap-3">
        <button
          onClick={mode === 'ai' ? handleGenerate : handleManual}
          disabled={!canGenerate || store.isGenerating}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {store.isGenerating ? 'Generating...' : mode === 'ai' ? 'Generate with Claude' : 'Start Manual'}
        </button>
        <button
          onClick={() => setMode(mode === 'ai' ? 'manual' : 'ai')}
          className="px-4 py-2.5 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          {mode === 'ai' ? 'Switch to Manual' : 'Switch to AI'}
        </button>
      </div>

      {/* Stream output */}
      {store.isGenerating && store.streamText && (
        <pre className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 max-h-60 overflow-y-auto whitespace-pre-wrap">
          {store.streamText}
        </pre>
      )}

      {/* Error */}
      {store.generationError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {store.generationError}
        </div>
      )}
    </div>
  )
}
