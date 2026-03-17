import { describe, it, expect } from 'vitest'
import { buildSlideHTML } from '../../../src/renderer/src/lib/buildSlideHTML'
import type { BuildSlideHTMLParams } from '../../../src/renderer/src/lib/buildSlideHTML'
import type { Slide } from '../../../src/shared/types/generation'
import type { Zone } from '../../../src/renderer/src/components/templates/ZoneEditor'

// Minimal slide factory
function makeSlide(overrides: Partial<Slide> = {}): Slide {
  return {
    uid: 'test-uid-1',
    slide_number: 1,
    slide_type: 'cover',
    hook_text: 'Test Hook',
    body_text: 'Test Body',
    cta_text: 'Test CTA',
    overlay_opacity: 0.5,
    ...overrides
  }
}

// Minimal zone factory
function makeZone(overrides: Partial<Zone> = {}): Zone {
  return {
    id: 'zone-1',
    type: 'hook',
    x: 100,
    y: 200,
    width: 800,
    height: 300,
    fontSize: 48,
    minFontSize: 24,
    ...overrides
  }
}

// Minimal params factory
function makeParams(overrides: Partial<BuildSlideHTMLParams> = {}): BuildSlideHTMLParams {
  const slide = makeSlide()
  return {
    slide,
    allSlides: [slide],
    zones: [makeZone()],
    settings: null,
    templateBackground: null,
    overlayColor: '#000000',
    overlayEnabled: false,
    customBackgroundPath: null,
    ...overrides
  }
}

describe('buildSlideHTML', () => {
  describe('zone defaults (no overrides)', () => {
    it('returns HTML using template zone position and fontSize defaults when no zone_overrides', () => {
      const zone = makeZone({ x: 100, y: 200, width: 800, height: 300, fontSize: 48 })
      const params = makeParams({ zones: [zone] })
      const html = buildSlideHTML(params)

      expect(html).toContain('left:100px')
      expect(html).toContain('top:200px')
      expect(html).toContain('font-size:48px')
    })
  })

  describe('zone_overrides - fontSize', () => {
    it('returns HTML with overridden font-size when zone_overrides has fontSize for a zone', () => {
      const zone = makeZone({ id: 'zone-1', fontSize: 48 })
      const slide = makeSlide({ zone_overrides: { 'zone-1': { fontSize: 60 } } })
      const params = makeParams({ slide, allSlides: [slide], zones: [zone] })
      const html = buildSlideHTML(params)

      expect(html).toContain('font-size:60px')
      expect(html).not.toContain('font-size:48px')
    })
  })

  describe('zone_overrides - position and color', () => {
    it('returns HTML with overridden x position and color when zone_overrides has x and color', () => {
      const zone = makeZone({ id: 'zone-1', x: 100, y: 200 })
      const slide = makeSlide({ zone_overrides: { 'zone-1': { x: 200, color: '#ff0000' } } })
      const params = makeParams({ slide, allSlides: [slide], zones: [zone] })
      const html = buildSlideHTML(params)

      expect(html).toContain('left:200px')
      expect(html).toContain('color:#ff0000')
    })
  })

  describe('zone_overrides - unknown zoneId', () => {
    it('ignores override silently when zoneId does not match any zone', () => {
      const zone = makeZone({ id: 'zone-real', x: 50, fontSize: 32 })
      const slide = makeSlide({ zone_overrides: { 'zone-nonexistent': { fontSize: 99 } } })
      const params = makeParams({ slide, allSlides: [slide], zones: [zone] })
      const html = buildSlideHTML(params)

      // Real zone uses its defaults
      expect(html).toContain('left:50px')
      expect(html).toContain('font-size:32px')
      // Override for nonexistent zone does not affect anything
      expect(html).not.toContain('font-size:99px')
    })
  })

  describe('fallback layout with empty zones', () => {
    it('uses fallback layout when zones array is empty', () => {
      const slide = makeSlide({ hook_text: 'Fallback Hook', body_text: 'Fallback Body' })
      const params = makeParams({ slide, allSlides: [slide], zones: [] })
      const html = buildSlideHTML(params)

      // Fallback layout uses absolute positioning with top:0
      expect(html).toContain('Fallback Hook')
      expect(html).toContain('Fallback Body')
      // Fallback uses font-size:56px for hook
      expect(html).toContain('font-size:56px')
    })
  })
})
