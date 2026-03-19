import { useEffect, useState, useMemo } from 'react'
import { useWizardStore } from '../stores/wizardStore'
import { useSettingsStore } from '../stores/settingsStore'
import { api } from '../lib/apiClient'
import type { BalanceRecommendation, BalanceWarning, GenerationResult, Settings } from '@shared/types'

interface CreatePostProps {
  onGenerated: () => void
}

function checkBlacklist(settings: Settings, area: string, approach: string, method: string, tonality: string, pillar: string) {
  const violations: Array<{ severity: 'hard' | 'soft'; label: string }> = []
  const dimValues: Record<string, string> = { area, approach, method, tonality, pillar }

  for (const entry of settings.blacklist) {
    const v1 = dimValues[entry.dimension1]
    const v2 = dimValues[entry.dimension2]
    if (v1 && v2 && v1 === entry.value1 && v2 === entry.value2) {
      violations.push({ severity: entry.severity, label: `${entry.value1} + ${entry.value2}` })
    }
  }
  return violations
}

export function CreatePost({ onGenerated }: CreatePostProps) {
  const store = useWizardStore()
  const { settings, load: loadSettings } = useSettingsStore()
  const [mode, setMode] = useState<'ai' | 'manual'>('ai')

  useEffect(() => {
    loadSettings()
    api.get<{ recommendation: BalanceRecommendation | null; warnings: BalanceWarning[] }>('/posts/meta/recommendation')
      .then(({ recommendation, warnings }) => {
        if (recommendation) store.setRecommendation(recommendation, warnings)
      })
      .catch(() => {})
  }, [])

  // Auto-select first item in each dropdown when settings load
  useEffect(() => {
    if (!settings) return
    if (!store.selectedPillar && settings.pillars.length > 0) {
      store.setField('selectedPillar', settings.pillars[0].name)
    }
    if (!store.selectedArea && settings.areas.length > 0) {
      store.setField('selectedArea', settings.areas[0].name)
    }
    if (!store.selectedMethod && settings.methods.length > 0) {
      store.setField('selectedMethod', settings.methods[0].name)
    }
    if (!store.selectedTonality && settings.tonalities.length > 0) {
      store.setField('selectedTonality', settings.tonalities[0].name)
    }
  }, [settings])

  // Filter methods by format constraints
  const filteredMethods = useMemo(() => {
    if (!settings) return []
    return settings.methods.filter(m => {
      if (!m.formatConstraints || m.formatConstraints.length === 0) return true
      return m.formatConstraints.includes(store.contentType)
    })
  }, [settings, store.contentType])

  // Reset method if current selection is invalid for format
  useEffect(() => {
    if (!settings || filteredMethods.length === 0) return
    const valid = filteredMethods.some(m => m.name === store.selectedMethod)
    if (!valid) {
      store.setField('selectedMethod', filteredMethods[0].name)
    }
  }, [filteredMethods])

  // Blacklist check
  const blacklistViolations = useMemo(() => {
    if (!settings) return []
    return checkBlacklist(settings, store.selectedArea, store.selectedApproach, store.selectedMethod, store.selectedTonality, store.selectedPillar)
  }, [settings, store.selectedArea, store.selectedApproach, store.selectedMethod, store.selectedTonality, store.selectedPillar])

  const canGenerate = store.selectedPillar && store.selectedArea && store.selectedMethod && store.selectedTonality

  const handleGenerate = () => {
    store.setIsGenerating(true)
    store.setGenerationError(null)

    const cancel = api.streamGenerate(
      {
        pillar: store.selectedPillar,
        area: store.selectedArea,
        approach: store.selectedApproach || null,
        method: store.selectedMethod,
        tonality: store.selectedTonality,
        contentType: store.contentType,
        slideCount: store.contentType === 'carousel' ? store.slideCount : undefined,
        impulse: store.impulse
      },
      (text) => store.appendStreamText(text),
      (result) => {
        store.setGenerationComplete(result as GenerationResult, settings?.visual?.cta)
        onGenerated()
      },
      (msg) => store.setGenerationError(msg)
    )

    return cancel
  }

  const handleManual = () => {
    store.initManualSlides(store.contentType, settings?.visual?.cta)
    onGenerated()
  }

  const pillars = settings?.pillars ?? []
  const areas = settings?.areas ?? []
  const approaches = settings?.approaches ?? []
  const tonalities = settings?.tonalities ?? []

  const badgeColors: Record<string, string> = {
    area: 'bg-green-100 text-green-700',
    pillar: 'bg-blue-100 text-blue-700',
    method: 'bg-gray-200 text-gray-700',
    tonality: 'bg-amber-100 text-amber-700',
    approach: 'bg-purple-100 text-purple-700'
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Create Post</h1>

      {/* Recommendation badges */}
      {store.recommendation && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-gray-500 mr-1">Recommended:</span>
          <span className={`text-xs px-2 py-0.5 rounded ${badgeColors.pillar}`}>{store.recommendation.pillar}</span>
          <span className={`text-xs px-2 py-0.5 rounded ${badgeColors.area}`}>{store.recommendation.area}</span>
          {store.recommendation.approach && (
            <span className={`text-xs px-2 py-0.5 rounded ${badgeColors.approach}`}>{store.recommendation.approach}</span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded ${badgeColors.method}`}>{store.recommendation.method}</span>
          <span className={`text-xs px-2 py-0.5 rounded ${badgeColors.tonality}`}>{store.recommendation.tonality}</span>
        </div>
      )}

      {/* Blacklist warning */}
      {blacklistViolations.length > 0 && (
        <div className="space-y-1">
          {blacklistViolations.map((v, i) => (
            <div key={i} className={`text-xs rounded px-3 py-1.5 ${
              v.severity === 'hard' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
            }`}>
              {v.severity === 'hard' ? 'Blocked' : 'Warning'}: {v.label}
            </div>
          ))}
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

      {/* --- CONTENT --- */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Content</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
            <select
              value={store.selectedArea}
              onChange={(e) => store.setField('selectedArea', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select...</option>
              {areas.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
            </select>
          </div>
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
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Approach</label>
          <select
            value={store.selectedApproach}
            onChange={(e) => store.setField('selectedApproach', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">-- optional --</option>
            {approaches.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
          </select>
        </div>
      </div>

      {/* --- EXECUTION --- */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Execution</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <div className="flex gap-2">
              {(['single', 'carousel'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => store.setField('contentType', type)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
                    store.contentType === type ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type === 'single' ? 'Single' : 'Carousel'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
            <select
              value={store.selectedMethod}
              onChange={(e) => store.setField('selectedMethod', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              {filteredMethods.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tonality</label>
            <select
              value={store.selectedTonality}
              onChange={(e) => store.setField('selectedTonality', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              {tonalities.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
          </div>
          {store.contentType === 'carousel' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slides</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => store.setField('slideCount', Math.max(3, store.slideCount - 1))}
                  className="w-8 h-8 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center justify-center text-sm font-medium"
                  disabled={store.slideCount <= 3}
                >
                  -
                </button>
                <span className="w-6 text-center text-sm font-semibold">{store.slideCount}</span>
                <button
                  onClick={() => store.setField('slideCount', Math.min(7, store.slideCount + 1))}
                  className="w-8 h-8 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center justify-center text-sm font-medium"
                  disabled={store.slideCount >= 7}
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- OPTIONAL --- */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Optional</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Impulse</label>
          <textarea
            value={store.impulse}
            onChange={(e) => store.setField('impulse', e.target.value)}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
            placeholder="Additional guidance for this post..."
          />
        </div>
      </div>

      {/* Mode switch + actions */}
      <div className="flex gap-3">
        <button
          onClick={mode === 'ai' ? handleGenerate : handleManual}
          disabled={!canGenerate || store.isGenerating}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {store.isGenerating && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 align-middle" />}
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
