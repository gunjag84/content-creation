import { describe, it, expect, beforeEach } from 'vitest'
import { useCreatePostStore } from '../../../src/renderer/src/stores/useCreatePostStore'

describe('useCreatePostStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useCreatePostStore.getState().reset()
  })

  describe('setSlide', () => {
    it('should update a specific field in a slide', () => {
      const store = useCreatePostStore.getState()

      // Initialize with some slides
      store.setGenerationComplete({
        slides: [
          { slide_type: 'cover', hook_text: 'Old Hook', body_text: '', cta_text: '' },
          { slide_type: 'content', hook_text: '', body_text: 'Old Body', cta_text: '' },
          { slide_type: 'cta', hook_text: '', body_text: '', cta_text: 'Old CTA' }
        ],
        caption: 'Test caption'
      })

      // Update slide 1's hook_text
      store.setSlide(1, 'hook_text', 'New Hook')

      const slides = useCreatePostStore.getState().generatedSlides
      expect(slides[1].hook_text).toBe('New Hook')
      // Other slides should be unchanged
      expect(slides[0].hook_text).toBe('Old Hook')
      expect(slides[2].cta_text).toBe('Old CTA')
    })
  })

  describe('reorderSlides', () => {
    it('should reorder slides from index 0 to 2', () => {
      const store = useCreatePostStore.getState()

      // Initialize with labeled slides
      store.setGenerationComplete({
        slides: [
          { slide_type: 'cover', hook_text: 'A', body_text: '', cta_text: '' },
          { slide_type: 'content', hook_text: 'B', body_text: '', cta_text: '' },
          { slide_type: 'cta', hook_text: 'C', body_text: '', cta_text: '' }
        ],
        caption: 'Test caption'
      })

      // Move slide 0 (A) to position 2
      store.reorderSlides(0, 2)

      const slides = useCreatePostStore.getState().generatedSlides
      expect(slides[0].hook_text).toBe('B')
      expect(slides[1].hook_text).toBe('C')
      expect(slides[2].hook_text).toBe('A')
    })
  })

  describe('reset', () => {
    it('should reset all fields to initial values', () => {
      const store = useCreatePostStore.getState()

      // Modify multiple fields
      store.setStep(3)
      store.setMode('manual')
      store.setSelection('selectedPillar', 'Health')
      store.setCaption('Test caption')
      store.setGenerationComplete({
        slides: [
          { slide_type: 'cover', hook_text: 'Test', body_text: '', cta_text: '' }
        ],
        caption: 'Generated'
      })

      // Reset
      store.reset()

      const state = useCreatePostStore.getState()
      expect(state.currentStep).toBe(1)
      expect(state.mode).toBe('ai')
      expect(state.selectedPillar).toBe('')
      expect(state.caption).toBe('')
      expect(state.generatedSlides).toEqual([])
    })
  })

  describe('setStep', () => {
    it('should update the current step', () => {
      const store = useCreatePostStore.getState()

      store.setStep(3)

      expect(useCreatePostStore.getState().currentStep).toBe(3)

      store.setStep(5)

      expect(useCreatePostStore.getState().currentStep).toBe(5)
    })
  })
})
