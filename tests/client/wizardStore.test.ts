import { describe, it, expect, beforeEach } from 'vitest'
import { useWizardStore } from '../../src/client/stores/wizardStore'
import type { Slide, ZoneOverride } from '../../src/shared/types'

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

describe('wizardStore - setZoneOverride', () => {
  beforeEach(() => useWizardStore.getState().reset())

  it('deep merges into zone_overrides without touching other fields', () => {
    const slide = makeSlide({ zone_overrides: { hook: { fontSize: 48, color: '#fff' } } })
    useWizardStore.getState().setSlides([slide])
    useWizardStore.getState().setZoneOverride(0, 'hook', { fontWeight: 'bold' })

    const result = useWizardStore.getState().slides[0].zone_overrides?.['hook']
    expect(result?.fontSize).toBe(48)        // preserved
    expect(result?.color).toBe('#fff')        // preserved
    expect(result?.fontWeight).toBe('bold')   // merged in
  })

  it('pushes current slides to history', () => {
    const slide = makeSlide({})
    useWizardStore.getState().setSlides([slide])
    const before = useWizardStore.getState().slides

    useWizardStore.getState().setZoneOverride(0, 'hook', { fontSize: 60 })
    expect(useWizardStore.getState().history).toHaveLength(1)
    expect(useWizardStore.getState().history[0]).toEqual(before)
  })

  it('clears redo stack on new change', () => {
    const slides = [makeSlide({})]
    useWizardStore.getState().setSlides(slides)
    useWizardStore.getState().setZoneOverride(0, 'hook', { fontSize: 60 })
    useWizardStore.getState().undo()
    expect(useWizardStore.getState().future).toHaveLength(1)

    useWizardStore.getState().setZoneOverride(0, 'hook', { fontSize: 72 })
    expect(useWizardStore.getState().future).toHaveLength(0)
  })

  it('creates zone_overrides entry when none existed', () => {
    const slide = makeSlide({})
    useWizardStore.getState().setSlides([slide])
    useWizardStore.getState().setZoneOverride(0, 'body', { color: '#ff0000' })

    const result = useWizardStore.getState().slides[0].zone_overrides?.['body']
    expect(result?.color).toBe('#ff0000')
  })
})

describe('wizardStore - updateZoneOverrideLive', () => {
  beforeEach(() => useWizardStore.getState().reset())

  it('updates slide without pushing to history', () => {
    const slide = makeSlide({})
    useWizardStore.getState().setSlides([slide])
    useWizardStore.getState().updateZoneOverrideLive(0, 'hook', { posTop: 100 })

    expect(useWizardStore.getState().slides[0].zone_overrides?.['hook']?.posTop).toBe(100)
    expect(useWizardStore.getState().history).toHaveLength(0)
  })
})

describe('wizardStore - applyZoneOverrideToAll', () => {
  beforeEach(() => useWizardStore.getState().reset())

  it('skips first and last slide, applies to content slides', () => {
    const slides = [
      makeSlide({ slide_number: 1, slide_type: 'cover' }),
      makeSlide({ slide_number: 2, slide_type: 'content' }),
      makeSlide({ slide_number: 3, slide_type: 'content' }),
      makeSlide({ slide_number: 4, slide_type: 'cta' }),
    ]
    useWizardStore.getState().setSlides(slides)
    useWizardStore.getState().applyZoneOverrideToAll('body', { fontSize: 40 })

    const updated = useWizardStore.getState().slides
    expect(updated[0].zone_overrides?.['body']?.fontSize).toBeUndefined() // skipped (first)
    expect(updated[1].zone_overrides?.['body']?.fontSize).toBe(40)
    expect(updated[2].zone_overrides?.['body']?.fontSize).toBe(40)
    expect(updated[3].zone_overrides?.['body']?.fontSize).toBeUndefined() // skipped (last)
  })

  it('is a no-op when slides.length <= 2', () => {
    const slides = [makeSlide({}), makeSlide({})]
    useWizardStore.getState().setSlides(slides)
    const before = [...useWizardStore.getState().slides]
    useWizardStore.getState().applyZoneOverrideToAll('body', { fontSize: 40 })

    expect(useWizardStore.getState().slides).toEqual(before)
    expect(useWizardStore.getState().history).toHaveLength(0)
  })

  it('pushes to history', () => {
    const slides = [makeSlide({}), makeSlide({}), makeSlide({})]
    useWizardStore.getState().setSlides(slides)
    useWizardStore.getState().applyZoneOverrideToAll('body', { color: '#aaa' })
    expect(useWizardStore.getState().history).toHaveLength(1)
  })
})

describe('wizardStore - undo/redo', () => {
  beforeEach(() => useWizardStore.getState().reset())

  it('undo restores previous slides, redo goes forward', () => {
    const slide = makeSlide({})
    useWizardStore.getState().setSlides([slide])

    useWizardStore.getState().setZoneOverride(0, 'hook', { fontSize: 60 })
    const afterFirst = useWizardStore.getState().slides[0].zone_overrides?.['hook']?.fontSize
    expect(afterFirst).toBe(60)

    useWizardStore.getState().undo()
    expect(useWizardStore.getState().slides[0].zone_overrides?.['hook']?.fontSize).toBeUndefined()

    useWizardStore.getState().redo()
    expect(useWizardStore.getState().slides[0].zone_overrides?.['hook']?.fontSize).toBe(60)
  })

  it('undo is a no-op when history is empty', () => {
    const slide = makeSlide({})
    useWizardStore.getState().setSlides([slide])
    const before = [...useWizardStore.getState().slides]
    useWizardStore.getState().undo()
    expect(useWizardStore.getState().slides).toEqual(before)
  })

  it('redo is a no-op when future is empty', () => {
    const slide = makeSlide({})
    useWizardStore.getState().setSlides([slide])
    const before = [...useWizardStore.getState().slides]
    useWizardStore.getState().redo()
    expect(useWizardStore.getState().slides).toEqual(before)
  })

  it('caps history at 50 entries', () => {
    const slide = makeSlide({})
    useWizardStore.getState().setSlides([slide])
    for (let i = 0; i < 55; i++) {
      useWizardStore.getState().setZoneOverride(0, 'hook', { fontSize: i })
    }
    expect(useWizardStore.getState().history.length).toBeLessThanOrEqual(50)
  })
})

describe('canvas drag/resize math', () => {
  // Test the pure math invariants used by SlidePreview drag handlers
  const SLIDE_W = 1080
  const SLIDE_H = 1350
  const MIN_W = 100
  const MIN_H = 60

  function clamp(val: number, min: number, max: number) {
    return Math.max(min, Math.min(max, val))
  }

  function computeDragPosition(startTop: number, startLeft: number, startW: number, startH: number, dx: number, dy: number) {
    return {
      top: clamp(startTop + dy, 0, SLIDE_H - startH),
      left: clamp(startLeft + dx, 0, SLIDE_W - startW),
    }
  }

  function computeResizeSE(startW: number, startH: number, dx: number, dy: number) {
    return {
      width: Math.max(MIN_W, startW + dx),
      height: Math.max(MIN_H, startH + dy),
    }
  }

  it('drag delta moves position correctly', () => {
    const result = computeDragPosition(100, 50, 400, 300, 20, 30)
    expect(result.top).toBe(130)
    expect(result.left).toBe(70)
  })

  it('drag clamps to canvas left/top boundary', () => {
    const result = computeDragPosition(10, 10, 400, 300, -200, -200)
    expect(result.top).toBe(0)
    expect(result.left).toBe(0)
  })

  it('drag clamps to canvas right/bottom boundary', () => {
    const result = computeDragPosition(900, 800, 400, 300, 999, 999)
    expect(result.top).toBe(SLIDE_H - 300)   // 1350 - 300 = 1050
    expect(result.left).toBe(SLIDE_W - 400)  // 1080 - 400 = 680
  })

  it('resize enforces minimum width and height', () => {
    const result = computeResizeSE(200, 150, -500, -500) // shrink way too small
    expect(result.width).toBe(MIN_W)
    expect(result.height).toBe(MIN_H)
  })

  it('resize allows growth beyond defaults', () => {
    const result = computeResizeSE(200, 150, 300, 200)
    expect(result.width).toBe(500)
    expect(result.height).toBe(350)
  })

  it('clamp function works correctly', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(15, 0, 10)).toBe(10)
    expect(clamp(0, 0, 0)).toBe(0)
  })
})

describe('wizardStore - setZoneOverride position override', () => {
  beforeEach(() => useWizardStore.getState().reset())

  it('stores posTop, posLeft, posWidth, posHeight', () => {
    const slide = makeSlide({})
    useWizardStore.getState().setSlides([slide])
    const override: ZoneOverride = { posTop: 100, posLeft: 50, posWidth: 500, posHeight: 200 }
    useWizardStore.getState().setZoneOverride(0, 'hook', override)

    const result = useWizardStore.getState().slides[0].zone_overrides?.['hook']
    expect(result?.posTop).toBe(100)
    expect(result?.posLeft).toBe(50)
    expect(result?.posWidth).toBe(500)
    expect(result?.posHeight).toBe(200)
  })
})

describe('wizardStore - initManualSlides defaultCta', () => {
  beforeEach(() => useWizardStore.getState().reset())

  it('pre-populates cta_text on last slide when defaultCta provided', () => {
    useWizardStore.getState().initManualSlides('carousel', 'Follow for more')
    const slides = useWizardStore.getState().slides
    const last = slides[slides.length - 1]
    expect(last.cta_text).toContain('Follow for more')
  })

  it('leaves cta_text empty on last slide when no defaultCta', () => {
    useWizardStore.getState().initManualSlides('carousel')
    const slides = useWizardStore.getState().slides
    const last = slides[slides.length - 1]
    expect(last.cta_text).toBe('')
  })

  it('does not pre-populate cta_text on non-last slides', () => {
    useWizardStore.getState().initManualSlides('carousel', 'Follow for more')
    const slides = useWizardStore.getState().slides
    // slide 0 is cover, slides 1-3 are content
    slides.slice(0, -1).forEach(s => {
      expect(s.cta_text).toBe('')
    })
  })
})
