import { useState, useEffect, useRef } from 'react'
import { useCreatePostStore } from '../../stores/useCreatePostStore'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { ChevronDown, ChevronUp, AlertCircle, Sparkles, Loader2 } from 'lucide-react'

export function Step2Generation() {
  const {
    mode,
    selectedPillar,
    selectedTheme,
    selectedMechanic,
    contentType,
    impulse,
    customBackgroundPath,
    isGenerating,
    generationError,
    setStep,
    setGenerationComplete,
    setIsGenerating,
    setGenerationError
  } = useCreatePostStore()

  const [displayText, setDisplayText] = useState('')
  const [showPrompt, setShowPrompt] = useState(false)
  const [assembledPrompt, setAssembledPrompt] = useState('')
  const [retrying, setRetrying] = useState(false)
  const textRef = useRef('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasStartedRef = useRef(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  // Manual mode: skip generation entirely
  useEffect(() => {
    if (mode === 'manual') {
      // Create empty slide structure based on contentType
      const slideCount = contentType === 'carousel' ? 5 : 1
      const emptySlides = Array.from({ length: slideCount }, (_, idx) => ({
        uid: crypto.randomUUID(),
        slide_number: idx + 1,
        slide_type: (idx === 0 ? 'cover' : idx === slideCount - 1 ? 'cta' : 'content') as 'cover' | 'content' | 'cta',
        hook_text: '',
        body_text: '',
        cta_text: '',
        overlay_opacity: 0.5
      }))

      setGenerationComplete({
        slides: emptySlides,
        caption: ''
      })

      // Advance to Step 3 immediately
      setStep(3)
    }
  }, [mode, contentType, setGenerationComplete, setStep])

  // AI mode: start generation on mount (ref guard prevents double-fire in React StrictMode)
  useEffect(() => {
    if (mode === 'ai' && !retrying && !hasStartedRef.current) {
      hasStartedRef.current = true
      startGeneration()
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
    }
  }, [mode])

  // Token accumulation anti-flicker
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayText(textRef.current)
    }, 100)

    return () => clearInterval(interval)
  }, [])

  // Auto-scroll to bottom as text appears
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [displayText])

  const startGeneration = async () => {
    textRef.current = ''
    setDisplayText('')
    setIsGenerating(true)
    setGenerationError(null)

    // Set up event listeners - collect cleanup functions for deferred call
    const cleanups: (() => void)[] = []
    const doCleanup = () => {
      cleanups.forEach((fn) => fn())
      cleanupRef.current = null
    }

    cleanups.push(window.api.generation.onToken((token: string) => {
      textRef.current += token
    }))

    cleanups.push(window.api.generation.onComplete((result) => {
      setGenerationComplete(result)
      doCleanup()
    }))

    cleanups.push(window.api.generation.onError((error) => {
      setGenerationError(error.message)
      doCleanup()
    }))

    cleanupRef.current = doCleanup

    try {
      const response = await window.api.generation.streamContent({
        pillar: selectedPillar,
        theme: selectedTheme,
        mechanic: selectedMechanic,
        contentType,
        impulse: impulse || ''
      })

      if (response.started && response.prompt) {
        setAssembledPrompt(response.prompt)
      } else if (!response.started) {
        setGenerationError('Failed to start generation. Check your API key in Settings.')
        doCleanup()
      }
    } catch (error) {
      setGenerationError((error as Error).message)
      doCleanup()
    }
  }

  const handleRetry = () => {
    hasStartedRef.current = false
    setRetrying(true)
    textRef.current = ''
    setDisplayText('')
    startGeneration().then(() => setRetrying(false))
  }

  const handleNewDraft = () => {
    hasStartedRef.current = false
    // Clear only generation output - NOT Step 1 selections (pillar/theme/mechanic)
    setGenerationComplete({ slides: [], caption: '' })
    setGenerationError(null)
    setRetrying(true)
    textRef.current = ''
    setDisplayText('')
    startGeneration().then(() => setRetrying(false))
  }

  const handleContinue = () => {
    setStep(3)
  }

  // Show spinner for manual mode until useEffect fires setStep(3)
  if (mode === 'manual') {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        <span className="ml-3 text-slate-400">Setting up slides...</span>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Generation Display Card */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-100">
            <Sparkles className="h-5 w-5 text-blue-400" />
            {isGenerating ? (
              <span className="animate-pulse">Generating your content...</span>
            ) : generationError ? (
              <span className="text-red-400">Generation Failed</span>
            ) : displayText ? (
              <span className="text-green-400">Content Ready!</span>
            ) : (
              <span className="text-slate-400">Preparing...</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Streaming Text Display */}
          <div
            ref={scrollRef}
            className="max-h-96 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 p-4"
          >
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-300">
              {displayText || (isGenerating ? 'Waiting for response...' : 'Ready to generate')}
            </pre>
          </div>

          {/* View Prompt Collapse */}
          <div className="space-y-2">
            <button
              onClick={() => setShowPrompt(!showPrompt)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              <span>View prompt</span>
              {showPrompt ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showPrompt && (
              <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
                <pre className="whitespace-pre-wrap text-xs text-slate-400">
                  {assembledPrompt}
                </pre>
              </div>
            )}
          </div>

          {/* Error State */}
          {generationError && (
            <div className="rounded-lg border border-amber-600 bg-amber-950 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-5 w-5 text-amber-400" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-amber-200">{generationError}</p>
                  <Button variant="outline" onClick={handleRetry} className="gap-2">
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!isGenerating && !generationError && displayText && (
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleNewDraft} className="gap-2">
                New Draft
              </Button>
              <Button onClick={handleContinue} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Continue to Edit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
