import { useEffect, useState, useMemo, useRef } from 'react'
import { useWizardStore } from '../stores/wizardStore'
import { useSettingsStore } from '../stores/settingsStore'
import { api } from '../lib/apiClient'
import { getScenariosForPillar, getMethodsForScenario } from '@shared/pillarConstraints'
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
    api.get<{ recommendation: BalanceRecommendation | null; warnings: BalanceWarning[] }>('/posts/meta/recommendation')
      .then(({ recommendation, warnings }) => {
        if (recommendation) store.setRecommendation(recommendation, warnings)
      })
      .catch(() => {})
  }, [])

  // Auto-select first pillar when settings load
  useEffect(() => {
    if (!settings) return
    if (!store.selectedPillar && settings.pillars.length > 0) {
      store.setField('selectedPillar', settings.pillars[0].name)
    }
  }, [settings])

  // Cascade reset when pillar changes
  useEffect(() => {
    if (!settings || !store.selectedPillar) return
    const pillarScenarios = getScenariosForPillar(settings, store.selectedPillar)

    // Reset scenario to first of new pillar
    const currentScenarioValid = pillarScenarios.some(s => s.name === store.selectedScenario)
    if (!currentScenarioValid) {
      store.setField('selectedScenario', pillarScenarios.length > 0 ? pillarScenarios[0].name : '')
    }
  }, [store.selectedPillar, settings])

  // Reset method when scenario changes
  useEffect(() => {
    if (!settings || !store.selectedPillar || !store.selectedScenario) return
    const scenarioMethods = getMethodsForScenario(settings, store.selectedPillar, store.selectedScenario).filter(m => {
      if (!m.formatConstraints || m.formatConstraints.length === 0) return true
      return m.formatConstraints.includes(store.contentType)
    })
    const currentMethodValid = scenarioMethods.some(m => m.name === store.selectedMethod)
    if (!currentMethodValid && scenarioMethods.length > 0) {
      store.setField('selectedMethod', scenarioMethods[0].name)
    }
  }, [store.selectedScenario, store.selectedPillar, store.contentType, settings])

  // Derived filtered lists
  const scenarios = useMemo(() => {
    if (!settings) return []
    return getScenariosForPillar(settings, store.selectedPillar)
  }, [settings, store.selectedPillar])

  const filteredMethods = useMemo(() => {
    if (!settings) return []
    const scenarioFiltered = getMethodsForScenario(settings, store.selectedPillar, store.selectedScenario)
    return scenarioFiltered.filter(m => {
      if (!m.formatConstraints || m.formatConstraints.length === 0) return true
      return m.formatConstraints.includes(store.contentType)
    })
  }, [settings, store.selectedPillar, store.selectedScenario, store.contentType])

  const canGenerate = store.selectedPillar
    && store.selectedScenario
    && store.selectedMethod

  const handleGenerate = () => {
    store.setIsGenerating(true)
    store.setGenerationError(null)

    const cancel = api.streamGenerate(
      {
        pillar: store.selectedPillar,
        scenario: store.selectedScenario,
        method: store.selectedMethod,
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

  const badgeColors: Record<string, string> = {
    pillar: 'bg-blue-100 text-blue-700',
    scenario: 'bg-purple-100 text-purple-700',
    method: 'bg-gray-200 text-gray-700',
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Create Post</h1>

      {/* Recommendation badges */}
      {store.recommendation && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-gray-500 mr-1">Recommended:</span>
          <span className={`text-xs px-2 py-0.5 rounded ${badgeColors.pillar}`}>{store.recommendation.pillar}</span>
          <span className={`text-xs px-2 py-0.5 rounded ${badgeColors.scenario}`}>{store.recommendation.scenario}</span>
          <span className={`text-xs px-2 py-0.5 rounded ${badgeColors.method}`}>{store.recommendation.method}</span>
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

        {/* Pillar - full width, root selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pillar</label>
          <select
            value={store.selectedPillar}
            onChange={(e) => store.setField('selectedPillar', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Select pillar...</option>
            {pillars.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
        </div>

        {/* Scenario - full width, pillar-specific */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Scenario</label>
          <select
            value={store.selectedScenario}
            onChange={(e) => store.setField('selectedScenario', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            disabled={!store.selectedPillar || scenarios.length === 0}
          >
            <option value="">Select scenario...</option>
            {scenarios.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
          {store.selectedPillar && scenarios.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">No scenarios configured for this pillar. Add scenarios in Brand Configuration.</p>
          )}
        </div>

        {/* Prompt Guidance - optional, highest priority instruction for generation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prompt Guidance
            <span className="ml-1 text-xs text-gray-400">(optional - overrides other settings when set)</span>
          </label>
          <textarea
            value={store.impulse}
            onChange={(e) => store.setField('impulse', e.target.value)}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
            placeholder="Free-form instruction for this post. Overrides scenario/method when conflicting..."
          />
        </div>
      </div>

      {/* --- EXECUTION --- */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Execution</p>
        <div className="grid grid-cols-2 gap-4">
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

      {/* Generation modal */}
      {(store.isGenerating || store.generationError) && (
        <GenerationModal
          isGenerating={store.isGenerating}
          streamText={store.streamText}
          error={store.generationError}
          onDismissError={() => store.setGenerationError(null)}
        />
      )}
    </div>
  )
}

function GenerationModal({ isGenerating, streamText, error, onDismissError }: {
  isGenerating: boolean
  streamText: string
  error: string | null
  onDismissError: () => void
}) {
  const scrollRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [streamText])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isGenerating && (
              <span className="inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            )}
            <h2 className="text-lg font-semibold text-gray-900">
              {error ? 'Generation failed' : isGenerating && !streamText ? 'Connecting to Claude...' : isGenerating ? 'Generating...' : 'Done'}
            </h2>
          </div>
          {error && (
            <button
              onClick={onDismissError}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              &times;
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {error ? (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg p-4">{error}</div>
          ) : (
            <pre
              ref={scrollRef}
              className="text-sm text-gray-700 font-mono bg-gray-50 rounded-lg p-4 h-80 overflow-y-auto whitespace-pre-wrap"
            >
              {streamText || 'Waiting for response...'}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
