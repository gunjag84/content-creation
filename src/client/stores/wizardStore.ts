import { create } from 'zustand'
import type { Slide, BalanceRecommendation, BalanceWarning, GenerationResult } from '@shared/types'

type WizardStep = 'create' | 'edit' | 'review' | 'done'

interface WizardStore {
  step: WizardStep
  // Step 1 - Create
  selectedPillar: string
  selectedTheme: string
  selectedMechanic: string
  contentType: 'single' | 'carousel'
  impulse: string
  recommendation: BalanceRecommendation | null
  warnings: BalanceWarning[]
  // Step 2 - Generation + Edit
  slides: Slide[]
  caption: string
  isGenerating: boolean
  generationError: string | null
  streamText: string
  // Step 3 - Review
  renderedImages: Array<{ slide_number: number; dataUrl: string }>
  postId: number | null

  // Actions
  setStep: (step: WizardStep) => void
  setField: (field: string, value: unknown) => void
  setRecommendation: (rec: BalanceRecommendation, warnings: BalanceWarning[]) => void
  setSlide: (index: number, field: keyof Slide, value: string | number) => void
  setSlides: (slides: Slide[]) => void
  setCaption: (text: string) => void
  appendStreamText: (text: string) => void
  setGenerationComplete: (result: GenerationResult) => void
  setIsGenerating: (value: boolean) => void
  setGenerationError: (error: string | null) => void
  setRenderedImages: (images: Array<{ slide_number: number; dataUrl: string }>) => void
  setPostId: (id: number) => void
  initManualSlides: (contentType: 'single' | 'carousel') => void
  applyBackgroundToAll: (index: number) => void
  reset: () => void
}

const initialState = {
  step: 'create' as const,
  selectedPillar: '',
  selectedTheme: '',
  selectedMechanic: '',
  contentType: 'carousel' as const,
  impulse: '',
  recommendation: null,
  warnings: [],
  slides: [],
  caption: '',
  isGenerating: false,
  generationError: null,
  streamText: '',
  renderedImages: [],
  postId: null
}

export const useWizardStore = create<WizardStore>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  setField: (field, value) => set({ [field]: value }),

  setRecommendation: (rec, warnings) => set({
    recommendation: rec,
    warnings,
    selectedPillar: rec.pillar,
    selectedTheme: rec.theme,
    selectedMechanic: rec.mechanic
  }),

  setSlide: (index, field, value) => set((state) => {
    const slides = [...state.slides]
    if (index >= 0 && index < slides.length) {
      slides[index] = { ...slides[index], [field]: value }
    }
    return { slides }
  }),

  setSlides: (slides) => set({ slides }),
  setCaption: (text) => set({ caption: text }),
  appendStreamText: (text) => set((state) => ({ streamText: state.streamText + text })),

  setGenerationComplete: (result) => set({
    slides: result.slides.map((s, i) => ({
      uid: crypto.randomUUID(),
      slide_number: i + 1,
      slide_type: s.slide_type,
      hook_text: s.hook_text,
      body_text: s.body_text,
      cta_text: s.cta_text,
      overlay_opacity: 0.5
    })),
    caption: result.caption,
    isGenerating: false,
    generationError: null,
    streamText: ''
  }),

  setIsGenerating: (value) => set({ isGenerating: value }),
  setGenerationError: (error) => set({ generationError: error, isGenerating: false }),
  setRenderedImages: (images) => set({ renderedImages: images }),
  setPostId: (id) => set({ postId: id }),

  initManualSlides: (contentType) => {
    const count = contentType === 'single' ? 1 : 5
    const slides: Slide[] = Array.from({ length: count }, (_, i) => ({
      uid: crypto.randomUUID(),
      slide_number: i + 1,
      slide_type: i === 0 ? 'cover' : i === count - 1 ? 'cta' : 'content',
      hook_text: '',
      body_text: '',
      cta_text: '',
      overlay_opacity: 0.5
    }))
    set({ slides, caption: '' })
  },

  applyBackgroundToAll: (index) => set((state) => {
    const src = state.slides[index]
    return {
      slides: state.slides.map((s, i) => i === index ? s : {
        ...s,
        custom_background_path: src.custom_background_path,
        background_position_x: src.background_position_x,
        background_position_y: src.background_position_y,
        background_scale: src.background_scale,
      })
    }
  }),

  reset: () => set({ ...initialState })
}))
