import { create } from 'zustand'
import type {
  Slide,
  ZoneOverride,
  SlidePreset,
  BalanceRecommendation,
  BalanceWarning,
  GenerationResult,
  StoryProposal
} from '../../../shared/types/generation'

interface CreatePostState {
  // Navigation
  currentStep: 1 | 2 | 3 | 4 | 5
  mode: 'ai' | 'manual'

  // Step 1 - Recommendation & Selection
  recommendation: BalanceRecommendation | null
  warnings: BalanceWarning[]
  selectedPillar: string
  selectedTheme: string
  selectedMechanic: string
  contentType: 'single' | 'carousel'
  impulse: string
  customBackgroundPath: string | null
  selectedTemplateId: number | null
  adHoc: boolean

  // Step 2/3 - Generation & Editing
  generatedSlides: Slide[]
  caption: string
  isGenerating: boolean
  generationError: string | null

  // Step 4 - Rendering
  renderedPNGs: string[] // base64 data URLs
  postId: number | null // DB id after save

  // Step 5 - Stories
  storyProposals: StoryProposal[]
  approvedStories: Set<number> // indices
  exportFolder: string | null

  // History (undo/redo)
  slideHistory: Slide[][]
  slideHistoryFuture: Slide[][]

  // Actions
  setStep: (step: 1 | 2 | 3 | 4 | 5) => void
  setSelectedTemplateId: (id: number | null) => void
  setMode: (mode: 'ai' | 'manual') => void
  setRecommendation: (rec: BalanceRecommendation, warnings: BalanceWarning[]) => void
  setAdHoc: (value: boolean) => void
  setSelection: (field: 'selectedPillar' | 'selectedTheme' | 'selectedMechanic' | 'contentType' | 'impulse' | 'customBackgroundPath', value: string | null) => void
  setSlide: (index: number, field: keyof Slide, value: string | number) => void
  reorderSlides: (fromIndex: number, toIndex: number) => void
  setZoneOverride: (slideIndex: number, zoneId: string, override: Partial<ZoneOverride>) => void
  applyPreset: (slideIndex: number, preset: SlidePreset) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  setCaption: (text: string) => void
  appendGeneratingToken: (token: string) => void
  setGenerationComplete: (result: GenerationResult) => void
  setRenderedPNGs: (pngs: string[]) => void
  setPostId: (id: number) => void
  setStoryProposals: (proposals: StoryProposal[]) => void
  toggleStoryApproval: (index: number) => void
  setExportFolder: (path: string) => void
  setIsGenerating: (value: boolean) => void
  setGenerationError: (error: string | null) => void
  initManualSlides: (contentType: 'single' | 'carousel') => void
  reset: () => void
}

const initialState = {
  // Navigation
  currentStep: 1 as const,
  mode: 'ai' as const,

  // Step 1
  recommendation: null,
  warnings: [],
  selectedPillar: '',
  selectedTheme: '',
  selectedMechanic: '',
  contentType: 'carousel' as const,
  impulse: '',
  customBackgroundPath: null,
  selectedTemplateId: null,
  adHoc: false,

  // Step 2/3
  generatedSlides: [],
  caption: '',
  isGenerating: false,
  generationError: null,

  // Step 4
  renderedPNGs: [],
  postId: null,

  // Step 5
  storyProposals: [],
  approvedStories: new Set<number>(),
  exportFolder: null,

  // History
  slideHistory: [],
  slideHistoryFuture: []
}

export const useCreatePostStore = create<CreatePostState>((set) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),

  setSelectedTemplateId: (id) => set({ selectedTemplateId: id }),

  setMode: (mode) => set({ mode }),

  setAdHoc: (value) => set({ adHoc: value }),

  setRecommendation: (rec, warnings) => set({
    recommendation: rec,
    warnings,
    selectedPillar: rec.pillar,
    selectedTheme: rec.theme,
    selectedMechanic: rec.mechanic
  }),

  setSelection: (field, value) => {
    if (field === 'contentType') {
      set({ [field]: value as 'single' | 'carousel' })
    } else {
      set({ [field]: value })
    }
  },

  setSlide: (index, field, value) => set((state) => {
    const slides = [...state.generatedSlides]
    if (index >= 0 && index < slides.length) {
      slides[index] = { ...slides[index], [field]: value }
    }
    return { generatedSlides: slides }
  }),

  reorderSlides: (fromIndex, toIndex) => set((state) => {
    const slides = [...state.generatedSlides]
    const [moved] = slides.splice(fromIndex, 1)
    slides.splice(toIndex, 0, moved)

    // Update slide_number to match new positions
    const reordered = slides.map((slide, idx) => ({
      ...slide,
      slide_number: idx + 1
    }))

    return { generatedSlides: reordered }
  }),

  setZoneOverride: (slideIndex, zoneId, override) => set((state) => {
    const prevSlides = state.generatedSlides
    const newHistory = [...state.slideHistory, prevSlides].slice(-50)
    const slides = prevSlides.map((slide, idx) => {
      if (idx !== slideIndex) return slide
      const existing = slide.zone_overrides ?? {}
      return {
        ...slide,
        zone_overrides: {
          ...existing,
          [zoneId]: { ...(existing[zoneId] ?? {}), ...override }
        }
      }
    })
    return {
      generatedSlides: slides,
      slideHistory: newHistory,
      slideHistoryFuture: []
    }
  }),

  applyPreset: (slideIndex, preset) => set((state) => {
    const slides = [...state.generatedSlides]
    if (slideIndex < 0 || slideIndex >= slides.length) return state
    const slide = { ...slides[slideIndex] }
    slide.zone_overrides = { ...preset.zone_overrides }
    if (preset.overlay_opacity !== undefined) {
      slide.overlay_opacity = preset.overlay_opacity
    }
    slides[slideIndex] = slide
    return {
      generatedSlides: slides,
      slideHistory: [...state.slideHistory, state.generatedSlides].slice(-50),
      slideHistoryFuture: []
    }
  }),

  undo: () => set((state) => {
    if (state.slideHistory.length === 0) return {}
    const history = [...state.slideHistory]
    const previous = history.pop()!
    return {
      generatedSlides: previous,
      slideHistory: history,
      slideHistoryFuture: [state.generatedSlides, ...state.slideHistoryFuture]
    }
  }),

  redo: () => set((state) => {
    if (state.slideHistoryFuture.length === 0) return {}
    const [next, ...remainingFuture] = state.slideHistoryFuture
    return {
      generatedSlides: next,
      slideHistory: [...state.slideHistory, state.generatedSlides],
      slideHistoryFuture: remainingFuture
    }
  }),

  canUndo: () => useCreatePostStore.getState().slideHistory.length > 0,

  canRedo: () => useCreatePostStore.getState().slideHistoryFuture.length > 0,

  setCaption: (text) => set({ caption: text }),

  appendGeneratingToken: (token) => set((state) => ({
    caption: state.caption + token
  })),

  setGenerationComplete: (result) => set({
    generatedSlides: result.slides.map((slide, idx) => ({
      uid: crypto.randomUUID(),
      slide_number: idx + 1,
      slide_type: slide.slide_type,
      hook_text: slide.hook_text,
      body_text: slide.body_text,
      cta_text: slide.cta_text,
      overlay_opacity: 0.5
    })),
    caption: result.caption,
    isGenerating: false,
    generationError: null
  }),

  setRenderedPNGs: (pngs) => set({ renderedPNGs: pngs }),

  setPostId: (id) => set({ postId: id }),

  setStoryProposals: (proposals) => set({ storyProposals: proposals }),

  toggleStoryApproval: (index) => set((state) => {
    const newApproved = new Set(state.approvedStories)
    if (newApproved.has(index)) {
      newApproved.delete(index)
    } else {
      newApproved.add(index)
    }
    return { approvedStories: newApproved }
  }),

  setExportFolder: (path) => set({ exportFolder: path }),

  setIsGenerating: (value) => set({ isGenerating: value }),

  setGenerationError: (error) => set(error ? { generationError: error, isGenerating: false } : { generationError: null }),

  initManualSlides: (contentType) => {
    const slideCount = contentType === 'single' ? 1 : 5
    const slides: Slide[] = []
    for (let i = 0; i < slideCount; i++) {
      const isFirst = i === 0
      const isLast = i === slideCount - 1
      slides.push({
        uid: crypto.randomUUID(),
        slide_number: i + 1,
        slide_type: isFirst ? 'cover' : isLast ? 'cta' : 'content',
        hook_text: '',
        body_text: '',
        cta_text: '',
        overlay_opacity: 0.5
      })
    }
    set({ generatedSlides: slides, caption: '' })
  },

  reset: () => set({
    ...initialState,
    approvedStories: new Set<number>(), // Create new Set instance
    slideHistory: [],
    slideHistoryFuture: []
  })
}))
