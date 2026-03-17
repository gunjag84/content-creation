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

  describe('setZoneOverride', () => {
    it('sets zone_overrides on the correct slide (VSED-01)', () => {
      const store = useCreatePostStore.getState()
      store.setGenerationComplete({
        slides: [
          { slide_type: 'cover', hook_text: 'A', body_text: '', cta_text: '' },
          { slide_type: 'content', hook_text: 'B', body_text: '', cta_text: '' }
        ],
        caption: ''
      })

      store.setZoneOverride(0, 'zone-1', { fontSize: 60 })

      const slides = useCreatePostStore.getState().generatedSlides
      expect(slides[0].zone_overrides?.['zone-1']?.fontSize).toBe(60)
    })

    it('merges with existing overrides rather than replacing entire map (VSED-01)', () => {
      const store = useCreatePostStore.getState()
      store.setGenerationComplete({
        slides: [{ slide_type: 'cover', hook_text: 'A', body_text: '', cta_text: '' }],
        caption: ''
      })

      store.setZoneOverride(0, 'zone-1', { fontSize: 48 })
      store.setZoneOverride(0, 'zone-2', { color: '#ff0000' })

      const slides = useCreatePostStore.getState().generatedSlides
      expect(slides[0].zone_overrides?.['zone-1']?.fontSize).toBe(48)
      expect(slides[0].zone_overrides?.['zone-2']?.color).toBe('#ff0000')
    })

    it('pushes previous generatedSlides to slideHistory before mutating (VSED-02)', () => {
      const store = useCreatePostStore.getState()
      store.setGenerationComplete({
        slides: [{ slide_type: 'cover', hook_text: 'Original', body_text: '', cta_text: '' }],
        caption: ''
      })

      store.setZoneOverride(0, 'zone-1', { fontSize: 60 })

      const state = useCreatePostStore.getState()
      expect(state.slideHistory.length).toBe(1)
      expect(state.slideHistory[0][0].hook_text).toBe('Original')
    })
  })

  describe('history (undo/redo)', () => {
    it('undo() restores generatedSlides to previous state (VSED-03)', () => {
      const store = useCreatePostStore.getState()
      store.setGenerationComplete({
        slides: [{ slide_type: 'cover', hook_text: 'Before', body_text: '', cta_text: '' }],
        caption: ''
      })
      store.setZoneOverride(0, 'zone-1', { fontSize: 60 })

      store.undo()

      const slides = useCreatePostStore.getState().generatedSlides
      expect(slides[0].zone_overrides).toBeUndefined()
    })

    it('undo() does nothing when slideHistory is empty (VSED-03)', () => {
      const store = useCreatePostStore.getState()
      store.setGenerationComplete({
        slides: [{ slide_type: 'cover', hook_text: 'Stable', body_text: '', cta_text: '' }],
        caption: ''
      })

      // No override set, so history is empty
      expect(() => store.undo()).not.toThrow()
      const slides = useCreatePostStore.getState().generatedSlides
      expect(slides[0].hook_text).toBe('Stable')
    })

    it('redo() after undo() restores the undone state (VSED-04)', () => {
      const store = useCreatePostStore.getState()
      store.setGenerationComplete({
        slides: [{ slide_type: 'cover', hook_text: 'Base', body_text: '', cta_text: '' }],
        caption: ''
      })
      store.setZoneOverride(0, 'zone-1', { fontSize: 72 })
      store.undo()

      store.redo()

      const slides = useCreatePostStore.getState().generatedSlides
      expect(slides[0].zone_overrides?.['zone-1']?.fontSize).toBe(72)
    })

    it('redo() does nothing when slideHistoryFuture is empty (VSED-04)', () => {
      const store = useCreatePostStore.getState()
      store.setGenerationComplete({
        slides: [{ slide_type: 'cover', hook_text: 'Stable', body_text: '', cta_text: '' }],
        caption: ''
      })

      expect(() => store.redo()).not.toThrow()
    })

    it('new mutation after undo clears slideHistoryFuture (VSED-04)', () => {
      const store = useCreatePostStore.getState()
      store.setGenerationComplete({
        slides: [{ slide_type: 'cover', hook_text: 'Base', body_text: '', cta_text: '' }],
        caption: ''
      })
      store.setZoneOverride(0, 'zone-1', { fontSize: 60 })
      store.undo()

      // New mutation after undo
      store.setZoneOverride(0, 'zone-2', { color: '#00ff00' })

      const state = useCreatePostStore.getState()
      expect(state.slideHistoryFuture.length).toBe(0)
    })

    it('slideHistory is capped at 50 entries (VSED-05)', () => {
      const store = useCreatePostStore.getState()
      store.setGenerationComplete({
        slides: [{ slide_type: 'cover', hook_text: 'Base', body_text: '', cta_text: '' }],
        caption: ''
      })

      // Push 55 overrides
      for (let i = 0; i < 55; i++) {
        store.setZoneOverride(0, 'zone-1', { fontSize: i + 10 })
      }

      const state = useCreatePostStore.getState()
      expect(state.slideHistory.length).toBe(50)
    })
  })

  describe('canUndo / canRedo', () => {
    it('canUndo() returns false when history is empty', () => {
      expect(useCreatePostStore.getState().canUndo()).toBe(false)
    })

    it('canUndo() returns true when history has entries', () => {
      const store = useCreatePostStore.getState()
      store.setGenerationComplete({
        slides: [{ slide_type: 'cover', hook_text: 'Base', body_text: '', cta_text: '' }],
        caption: ''
      })
      store.setZoneOverride(0, 'zone-1', { fontSize: 40 })

      expect(useCreatePostStore.getState().canUndo()).toBe(true)
    })

    it('canRedo() returns false when future is empty', () => {
      expect(useCreatePostStore.getState().canRedo()).toBe(false)
    })

    it('canRedo() returns true after undo', () => {
      const store = useCreatePostStore.getState()
      store.setGenerationComplete({
        slides: [{ slide_type: 'cover', hook_text: 'Base', body_text: '', cta_text: '' }],
        caption: ''
      })
      store.setZoneOverride(0, 'zone-1', { fontSize: 40 })
      store.undo()

      expect(useCreatePostStore.getState().canRedo()).toBe(true)
    })
  })

  describe('applyPreset', () => {
    it('applyPreset(0, preset) sets generatedSlides[0].zone_overrides to preset.zone_overrides (VSED-06)', () => {
      const store = useCreatePostStore.getState()
      store.setGenerationComplete({
        slides: [
          { slide_type: 'cover', hook_text: 'A', body_text: '', cta_text: '' }
        ],
        caption: ''
      })

      store.applyPreset(0, {
        id: 'p1',
        name: 'Test',
        zone_overrides: { 'zone-title': { fontSize: 56 } },
        created_at: Date.now()
      })

      const slides = useCreatePostStore.getState().generatedSlides
      expect(slides[0].zone_overrides?.['zone-title']?.fontSize).toBe(56)
    })

    it('applyPreset with overlay_opacity sets generatedSlides[0].overlay_opacity (VSED-06)', () => {
      const store = useCreatePostStore.getState()
      store.setGenerationComplete({
        slides: [
          { slide_type: 'cover', hook_text: 'A', body_text: '', cta_text: '' }
        ],
        caption: ''
      })

      store.applyPreset(0, {
        id: 'p1',
        name: 'Test',
        zone_overrides: {},
        overlay_opacity: 0.8,
        created_at: Date.now()
      })

      const slides = useCreatePostStore.getState().generatedSlides
      expect(slides[0].overlay_opacity).toBe(0.8)
    })

    it('applyPreset pushes to slideHistory (undoable) (VSED-06)', () => {
      const store = useCreatePostStore.getState()
      store.setGenerationComplete({
        slides: [
          { slide_type: 'cover', hook_text: 'Base', body_text: '', cta_text: '' }
        ],
        caption: ''
      })

      store.applyPreset(0, {
        id: 'p1',
        name: 'Test',
        zone_overrides: { 'zone-1': { fontSize: 48 } },
        created_at: Date.now()
      })

      const state = useCreatePostStore.getState()
      expect(state.slideHistory.length).toBe(1)

      store.undo()

      const afterUndo = useCreatePostStore.getState().generatedSlides
      expect(afterUndo[0].zone_overrides).toBeUndefined()
    })

    it('applyPreset without overlay_opacity leaves slide.overlay_opacity unchanged (VSED-06)', () => {
      const store = useCreatePostStore.getState()
      store.setGenerationComplete({
        slides: [
          { slide_type: 'cover', hook_text: 'A', body_text: '', cta_text: '' }
        ],
        caption: ''
      })

      // Set an initial opacity value
      const initialOpacity = useCreatePostStore.getState().generatedSlides[0].overlay_opacity

      store.applyPreset(0, {
        id: 'p1',
        name: 'No Opacity Preset',
        zone_overrides: { 'zone-title': { fontSize: 32 } },
        // overlay_opacity intentionally omitted
        created_at: Date.now()
      })

      const slides = useCreatePostStore.getState().generatedSlides
      expect(slides[0].overlay_opacity).toBe(initialOpacity)
    })
  })

  describe('reset clears history', () => {
    it('reset() clears slideHistory and slideHistoryFuture', () => {
      const store = useCreatePostStore.getState()
      store.setGenerationComplete({
        slides: [{ slide_type: 'cover', hook_text: 'Base', body_text: '', cta_text: '' }],
        caption: ''
      })
      store.setZoneOverride(0, 'zone-1', { fontSize: 40 })
      store.undo()

      store.reset()

      const state = useCreatePostStore.getState()
      expect(state.slideHistory).toEqual([])
      expect(state.slideHistoryFuture).toEqual([])
    })
  })
})
