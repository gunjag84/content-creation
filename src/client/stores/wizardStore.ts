import { create } from 'zustand'
import type { Slide, ZoneOverride, BalanceRecommendation, BalanceWarning, GenerationResult } from '@shared/types'

type WizardStep = 'create' | 'edit' | 'review' | 'done'

const MAX_HISTORY = 50

function toHtml(text: string): string {
  if (!text) return ''
  return `<p>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`
}

interface WizardStore {
  step: WizardStep
  // Step 1 - Create
  selectedPillar: string
  selectedScenario: string
  selectedMethod: string
  contentType: 'single' | 'carousel'
  slideCount: number
  impulse: string
  recommendation: BalanceRecommendation | null
  warnings: BalanceWarning[]
  // Step 2 - Generation + Edit
  slides: Slide[]
  caption: string
  isGenerating: boolean
  generationError: string | null
  streamText: string
  selectedHookId: string | null
  selectedCtaId: string | null
  selectedSituationId: string | null
  selectedScienceId: string | null
  // Step 3 - Review
  renderedImages: Array<{ slide_number: number; dataUrl: string }>
  postId: number | null
  // Undo/redo
  history: Slide[][]
  future: Slide[][]

  // Actions
  setStep: (step: WizardStep) => void
  setField: (field: string, value: unknown) => void
  setRecommendation: (rec: BalanceRecommendation, warnings: BalanceWarning[]) => void
  setSlide: (index: number, field: keyof Slide, value: string | number) => void
  setSlides: (slides: Slide[]) => void
  setCaption: (text: string) => void
  appendStreamText: (text: string) => void
  setGenerationComplete: (result: GenerationResult, defaultCta?: string) => void
  setIsGenerating: (value: boolean) => void
  setGenerationError: (error: string | null) => void
  setRenderedImages: (images: Array<{ slide_number: number; dataUrl: string }>) => void
  setPostId: (id: number) => void
  initManualSlides: (contentType: 'single' | 'carousel', defaultCta?: string) => void
  addSlide: (afterIndex: number) => void
  deleteSlide: (index: number) => void
  moveSlide: (fromIndex: number, toIndex: number) => void
  applyBackgroundToAll: (index: number) => void
  reset: () => void
  // Zone override actions
  setZoneOverride: (slideIndex: number, zoneId: string, override: ZoneOverride) => void
  updateZoneOverrideLive: (slideIndex: number, zoneId: string, override: ZoneOverride) => void
  resetZonePosition: (slideIndex: number, zoneId: string) => void
  clearZoneOverrides: (slideIndex: number, zoneId: string) => void
  applyZoneOverrideToAll: (zoneId: string, override: ZoneOverride) => void
  undo: () => void
  redo: () => void
}

const initialState = {
  step: 'create' as const,
  selectedPillar: '',
  selectedScenario: '',
  selectedMethod: '',
  contentType: 'carousel' as const,
  slideCount: 5,
  impulse: '',
  recommendation: null,
  warnings: [],
  slides: [],
  caption: '',
  isGenerating: false,
  generationError: null,
  streamText: '',
  selectedHookId: null,
  selectedCtaId: null,
  selectedSituationId: null,
  selectedScienceId: null,
  renderedImages: [],
  postId: null,
  history: [] as Slide[][],
  future: [] as Slide[][]
}

let lastSetSlideTime = 0

function mergeZoneOverride(slides: Slide[], slideIndex: number, zoneId: string, override: ZoneOverride): Slide[] {
  const next = [...slides]
  if (slideIndex < 0 || slideIndex >= next.length) return next
  const current = next[slideIndex]
  next[slideIndex] = {
    ...current,
    zone_overrides: {
      ...(current.zone_overrides ?? {}),
      [zoneId]: {
        ...(current.zone_overrides?.[zoneId] ?? {}),
        ...override
      }
    }
  }
  return next
}

export const useWizardStore = create<WizardStore>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  setField: (field, value) => set({ [field]: value }),

  setRecommendation: (rec, warnings) => set({
    recommendation: rec,
    warnings,
    selectedPillar: rec.pillar,
    selectedScenario: rec.scenario,
    selectedMethod: rec.method,
  }),

  setSlide: (index, field, value) => set((state) => {
    const slides = [...state.slides]
    if (index >= 0 && index < slides.length) {
      slides[index] = { ...slides[index], [field]: value }
    }
    const now = Date.now()
    const elapsed = now - lastSetSlideTime
    lastSetSlideTime = now
    if (elapsed > 500) {
      const newHistory = [...state.history, state.slides].slice(-MAX_HISTORY)
      return { slides, history: newHistory, future: [] }
    }
    return { slides }
  }),

  setSlides: (slides) => set({ slides }),
  setCaption: (text) => set({ caption: text }),
  appendStreamText: (text) => set((state) => ({ streamText: state.streamText + text })),

  setGenerationComplete: (result, defaultCta) => set({
    slides: result.slides.map((s, i) => {
      const isLast = i === result.slides.length - 1
      const ctaHtml = toHtml(s.cta_text) || (isLast && defaultCta ? toHtml(defaultCta) : '')
      return {
        uid: crypto.randomUUID(),
        slide_number: i + 1,
        slide_type: s.slide_type,
        hook_text: toHtml(s.hook_text),
        body_text: toHtml(s.body_text),
        cta_text: ctaHtml,
        overlay_opacity: 0.5
      }
    }),
    caption: result.caption,
    isGenerating: false,
    generationError: null,
    streamText: '',
    selectedHookId: (result as any).selectedHookId ?? null,
    selectedCtaId: (result as any).selectedCtaId ?? null,
    selectedSituationId: (result as any).selectedSituationId ?? null,
    selectedScienceId: (result as any).selectedScienceId ?? null,
  }),

  setIsGenerating: (value) => set({ isGenerating: value }),
  setGenerationError: (error) => set(error ? { generationError: error, isGenerating: false } : { generationError: null }),
  setRenderedImages: (images) => set({ renderedImages: images }),
  setPostId: (id) => set({ postId: id }),

  initManualSlides: (contentType, defaultCta) => {
    set((state) => {
    const count = contentType === 'single' ? 1 : state.slideCount
    const slides: Slide[] = Array.from({ length: count }, (_, i) => {
      const isLast = i === count - 1
      return {
        uid: crypto.randomUUID(),
        slide_number: i + 1,
        slide_type: i === 0 ? 'cover' : isLast ? 'cta' : 'content',
        hook_text: '',
        body_text: '',
        cta_text: isLast && defaultCta ? toHtml(defaultCta) : '',
        overlay_opacity: 0.5
      }
    })
    return { slides, caption: '' }
    })
  },

  addSlide: (afterIndex) => set((state) => {
    const newHistory = [...state.history, state.slides].slice(-MAX_HISTORY)
    const newSlide: Slide = {
      uid: crypto.randomUUID(),
      slide_number: afterIndex + 2,
      slide_type: 'content',
      hook_text: '',
      body_text: '',
      cta_text: '',
      overlay_opacity: 0.5
    }
    const next = [...state.slides]
    next.splice(afterIndex + 1, 0, newSlide)
    // Renumber
    next.forEach((s, i) => { s.slide_number = i + 1 })
    return { slides: next, history: newHistory, future: [] }
  }),

  deleteSlide: (index) => set((state) => {
    if (state.slides.length <= 1) return {}
    const newHistory = [...state.history, state.slides].slice(-MAX_HISTORY)
    const next = state.slides.filter((_, i) => i !== index)
    // Renumber and fix slide_type
    next.forEach((s, i) => {
      s.slide_number = i + 1
      if (i === 0) s.slide_type = 'cover'
      else if (i === next.length - 1 && next.length > 1) s.slide_type = 'cta'
      else s.slide_type = 'content'
    })
    return { slides: next, history: newHistory, future: [] }
  }),

  moveSlide: (fromIndex, toIndex) => set((state) => {
    if (fromIndex === toIndex) return {}
    if (fromIndex < 0 || fromIndex >= state.slides.length) return {}
    if (toIndex < 0 || toIndex >= state.slides.length) return {}
    const newHistory = [...state.history, state.slides].slice(-MAX_HISTORY)
    const next = [...state.slides]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    // Renumber and fix slide_type
    next.forEach((s, i) => {
      s.slide_number = i + 1
      if (i === 0) s.slide_type = 'cover'
      else if (i === next.length - 1 && next.length > 1) s.slide_type = 'cta'
      else s.slide_type = 'content'
    })
    return { slides: next, history: newHistory, future: [] }
  }),

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

  setZoneOverride: (slideIndex, zoneId, override) => set((state) => {
    const newHistory = [...state.history, state.slides].slice(-MAX_HISTORY)
    const nextSlides = mergeZoneOverride(state.slides, slideIndex, zoneId, override)
    return { slides: nextSlides, history: newHistory, future: [] }
  }),

  updateZoneOverrideLive: (slideIndex, zoneId, override) => set((state) => {
    const nextSlides = mergeZoneOverride(state.slides, slideIndex, zoneId, override)
    return { slides: nextSlides }
  }),

  resetZonePosition: (slideIndex, zoneId) => set((state) => {
    const next = [...state.slides]
    if (slideIndex < 0 || slideIndex >= next.length) return {}
    const current = next[slideIndex]
    const existing = current.zone_overrides?.[zoneId] ?? {}
    const { posTop: _t, posLeft: _l, posWidth: _w, posHeight: _h, ...rest } = existing
    next[slideIndex] = {
      ...current,
      zone_overrides: { ...(current.zone_overrides ?? {}), [zoneId]: rest }
    }
    const newHistory = [...state.history, state.slides].slice(-MAX_HISTORY)
    return { slides: next, history: newHistory, future: [] }
  }),

  clearZoneOverrides: (slideIndex, zoneId) => set((state) => {
    const next = [...state.slides]
    if (slideIndex < 0 || slideIndex >= next.length) return {}
    const current = next[slideIndex]
    const { [zoneId]: _removed, ...remaining } = current.zone_overrides ?? {}
    next[slideIndex] = { ...current, zone_overrides: remaining }
    const newHistory = [...state.history, state.slides].slice(-MAX_HISTORY)
    return { slides: next, history: newHistory, future: [] }
  }),

  applyZoneOverrideToAll: (zoneId, override) => set((state) => {
    if (state.slides.length <= 2) return {}
    const newHistory = [...state.history, state.slides].slice(-MAX_HISTORY)
    const nextSlides = state.slides.map((slide, i) => {
      if (i === 0 || i === state.slides.length - 1) return slide
      return {
        ...slide,
        zone_overrides: {
          ...(slide.zone_overrides ?? {}),
          [zoneId]: {
            ...(slide.zone_overrides?.[zoneId] ?? {}),
            ...override
          }
        }
      }
    })
    return { slides: nextSlides, history: newHistory, future: [] }
  }),

  undo: () => set((state) => {
    if (state.history.length === 0) return {}
    const prev = state.history[state.history.length - 1]
    const newHistory = state.history.slice(0, -1)
    const newFuture = [state.slides, ...state.future]
    return { slides: prev, history: newHistory, future: newFuture }
  }),

  redo: () => set((state) => {
    if (state.future.length === 0) return {}
    const next = state.future[0]
    const newFuture = state.future.slice(1)
    const newHistory = [...state.history, state.slides].slice(-MAX_HISTORY)
    return { slides: next, history: newHistory, future: newFuture }
  }),

  reset: () => set({ ...initialState })
}))
