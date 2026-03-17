import { create } from 'zustand'
import type {
  Slide,
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

  // Actions
  setStep: (step: 1 | 2 | 3 | 4 | 5) => void
  setMode: (mode: 'ai' | 'manual') => void
  setRecommendation: (rec: BalanceRecommendation, warnings: BalanceWarning[]) => void
  setSelection: (field: 'selectedPillar' | 'selectedTheme' | 'selectedMechanic' | 'contentType' | 'impulse' | 'customBackgroundPath', value: string | null) => void
  setSlide: (index: number, field: keyof Slide, value: string | number) => void
  reorderSlides: (fromIndex: number, toIndex: number) => void
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
  exportFolder: null
}

export const useCreatePostStore = create<CreatePostState>((set) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),

  setMode: (mode) => set({ mode }),

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

  setGenerationError: (error) => set({ generationError: error, isGenerating: false }),

  reset: () => set({
    ...initialState,
    approvedStories: new Set<number>() // Create new Set instance
  })
}))
