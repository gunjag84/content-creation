import { useState, useEffect, useRef } from 'react'
import { useCreatePostStore } from '../../stores/useCreatePostStore'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { ChevronDown, ChevronUp, AlertCircle, Sparkles } from 'lucide-react'

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
    reset
  } = useCreatePostStore()

  const [displayText, setDisplayText] = useState('')
  const [showPrompt, setShowPrompt] = useState(false)
  const [assembledPrompt, setAssembledPrompt] = useState('')
  const [retrying, setRetrying] = useState(false)
  const textRef = useRef('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Manual mode: skip generation entirely
  useEffect(() => {
    if (mode === 'manual') {
      // Create empty slide structure based on contentType
      const slideCount = contentType === 'carousel' ? 5 : 1
      const emptySlides = Array.from({ length: slideCount }, (_, idx) => ({
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

  // AI mode: start generation on mount
  useEffect(() => {
    if (mode === 'ai' && !retrying) {
      startGeneration()
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
    try {
      textRef.current = ''
      setDisplayText('')

      // Set up event listeners
      const cleanupToken = window.api.generation.onToken((token: string) => {
        textRef.current += token
      })

      const cleanupComplete = window.api.generation.onComplete((result) => {
        setGenerationComplete(result)
      })

      const cleanupError = window.api.generation.onError((error) => {
        console.error('Generation error:', error)
      })

      // Start streaming
      const response = await window.api.generation.streamContent({
        pillar: selectedPillar,
        theme: selectedTheme,
        mechanic: selectedMechanic,
        contentType,
        impulse: impulse || '',
        customBackgroundPath: customBackgroundPath || ''
      })

      if (response.started) {
        // Note: The prompt assembly happens in the IPC handler
        // For now, we'll show a placeholder
        setAssembledPrompt('[Prompt assembled in backend - not exposed to UI yet]')
      }

      // Cleanup on unmount
      return () => {
        cleanupToken()
        cleanupComplete()
        cleanupError()
      }
    } catch (error) {
      console.error('Failed to start generation:', error)
    }
  }

  const handleRetry = () => {
    setRetrying(true)
    textRef.current = ''
    setDisplayText('')
    startGeneration().then(() => setRetrying(false))
  }

  const handleNewDraft = () => {
    reset()
    setRetrying(true)
    textRef.current = ''
    setDisplayText('')
    startGeneration().then(() => setRetrying(false))
  }

  const handleContinue = () => {
    setStep(3)
  }

  // Don't render anything if manual mode (will redirect in useEffect)
  if (mode === 'manual') {
    return null
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
            ) : (
              <span className="text-green-400">Content Ready!</span>
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
