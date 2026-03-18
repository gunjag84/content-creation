import { describe, it, expect, beforeEach } from 'vitest'
import { useWizardStore } from '../../src/client/stores/wizardStore'
import type { Slide } from '../../src/shared/types'

const makeSlide = (overrides: Partial<Slide>): Slide => ({
  uid: crypto.randomUUID(),
  slide_number: 1,
  slide_type: 'content',
  hook_text: '',
  body_text: '',
  cta_text: '',
  overlay_opacity: 0.5,
  ...overrides
})

describe('wizardStore - applyBackgroundToAll', () => {
  beforeEach(() => useWizardStore.getState().reset())

  it('copies background to all slides including cover', () => {
    const slides: Slide[] = [
      makeSlide({ uid: 'a', slide_number: 1, slide_type: 'cover' }),
      makeSlide({ uid: 'b', slide_number: 2, slide_type: 'content', custom_background_path: 'uploads/photo.jpg', background_position_x: 30, background_position_y: 70, background_scale: 1.5 }),
      makeSlide({ uid: 'c', slide_number: 3, slide_type: 'content' }),
    ]
    useWizardStore.getState().setSlides(slides)
    useWizardStore.getState().applyBackgroundToAll(1)

    const updated = useWizardStore.getState().slides
    expect(updated[0].custom_background_path).toBe('uploads/photo.jpg')
    expect(updated[0].background_position_x).toBe(30)
    expect(updated[0].background_position_y).toBe(70)
    expect(updated[0].background_scale).toBe(1.5)
    expect(updated[2].custom_background_path).toBe('uploads/photo.jpg')
  })

  it('does not modify the source slide itself', () => {
    const slides: Slide[] = [
      makeSlide({ uid: 'a', slide_number: 1, slide_type: 'content', custom_background_path: 'uploads/photo.jpg', background_scale: 2.0 }),
      makeSlide({ uid: 'b', slide_number: 2, slide_type: 'content' }),
    ]
    useWizardStore.getState().setSlides(slides)
    const before = { ...useWizardStore.getState().slides[0] }
    useWizardStore.getState().applyBackgroundToAll(0)
    expect(useWizardStore.getState().slides[0]).toEqual(before)
  })
})
