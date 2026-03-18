import { describe, it, expect } from 'vitest'
import { buildSlideHTML } from '../../src/shared/buildSlideHTML'
import type { Slide, Settings } from '../../src/shared/types'

const baseSlide: Slide = {
  uid: 'test-uid',
  slide_number: 1,
  slide_type: 'cover',
  hook_text: 'Test Hook',
  body_text: 'Test Body',
  cta_text: 'Test CTA',
  overlay_opacity: 0.5
}

const baseSettings: Settings = {
  contextDocs: { brandVoice: '', targetPersona: '', productUVP: '', competitive: '', contentStrategy: '', pov: '' },
  visual: {
    colors: ['#ffffff', '#cccccc', '#1a1a2e'],
    fonts: { headline: '', body: '', cta: '' },
    fontLibrary: [],
    logo: '',
    cta: '',
    handle: ''
  },
  pillars: [],
  themes: [],
  mechanics: []
}

describe('buildSlideHTML - font resolution', () => {
  it('resolves Google Font preset to @import', () => {
    const settings = { ...baseSettings, visual: { ...baseSettings.visual, fonts: { headline: 'Josefin Sans', body: '', cta: '' } } }
    const html = buildSlideHTML({ slide: baseSlide, allSlides: [baseSlide], settings, baseUrl: 'http://localhost:3001' })
    expect(html).toContain("@import url('https://fonts.googleapis.com/css2?family=Josefin+Sans")
    expect(html).toContain("font-family:'Josefin Sans', sans-serif")
  })

  it('resolves legacy file path to @font-face', () => {
    const settings = { ...baseSettings, visual: { ...baseSettings.visual, fonts: { headline: 'uploads/my-font.ttf', body: '', cta: '' } } }
    const html = buildSlideHTML({ slide: baseSlide, allSlides: [baseSlide], settings, baseUrl: 'http://localhost:3001' })
    expect(html).toContain("@font-face")
    expect(html).toContain("font-family: 'CustomHeadline'")
    expect(html).toContain("/api/files/")
  })

  it('resolves custom:id to @font-face using fontLibrary', () => {
    const entry = { id: 'abc-123', name: 'My Brand Font', path: 'uploads/brand.ttf' }
    const settings = {
      ...baseSettings,
      visual: {
        ...baseSettings.visual,
        fonts: { headline: 'custom:abc-123', body: '', cta: '' },
        fontLibrary: [entry]
      }
    }
    const html = buildSlideHTML({ slide: baseSlide, allSlides: [baseSlide], settings, baseUrl: 'http://localhost:3001' })
    expect(html).toContain("@font-face")
    expect(html).toContain("font-family: 'CustomHeadline'")
    expect(html).toContain("uploads%2Fbrand.ttf")
  })

  it('resolves custom:id to sans-serif fallback when id not in library', () => {
    const settings = { ...baseSettings, visual: { ...baseSettings.visual, fonts: { headline: 'custom:missing-id', body: '', cta: '' } } }
    const html = buildSlideHTML({ slide: baseSlide, allSlides: [baseSlide], settings, baseUrl: 'http://localhost:3001' })
    expect(html).not.toContain("@font-face")
    expect(html).toContain('sans-serif')
  })

  it('resolves system font name as passthrough (no import)', () => {
    const settings = { ...baseSettings, visual: { ...baseSettings.visual, fonts: { headline: 'Arial', body: '', cta: '' } } }
    const html = buildSlideHTML({ slide: baseSlide, allSlides: [baseSlide], settings, baseUrl: 'http://localhost:3001' })
    expect(html).not.toContain("@font-face")
    expect(html).not.toContain("@import")
    expect(html).toContain("'Arial', sans-serif")
  })
})

describe('buildSlideHTML - background transform', () => {
  it('omits background wrapper when no custom_background_path', () => {
    const html = buildSlideHTML({ slide: baseSlide, allSlides: [baseSlide], settings: baseSettings, baseUrl: 'http://localhost:3001' })
    expect(html).not.toContain('transform:scale')
    expect(html).not.toContain('background:url')
  })

  it('renders transform wrapper with default position 50% 50% scale 1', () => {
    const slide = { ...baseSlide, custom_background_path: 'uploads/photo.jpg' }
    const html = buildSlideHTML({ slide, allSlides: [slide], settings: baseSettings, baseUrl: 'http://localhost:3001' })
    expect(html).toContain('transform:scale(1)')
    expect(html).toContain('50% 50%')
    expect(html).toContain('transform-origin:50% 50%')
    expect(html).toContain('overflow:hidden')
  })

  it('reflects custom x/y position in background-position and transform-origin', () => {
    const slide = { ...baseSlide, custom_background_path: 'uploads/photo.jpg', background_position_x: 30, background_position_y: 70 }
    const html = buildSlideHTML({ slide, allSlides: [slide], settings: baseSettings, baseUrl: 'http://localhost:3001' })
    expect(html).toContain('30% 70%')
    expect(html).toContain('transform-origin:30% 70%')
  })

  it('reflects custom scale in transform', () => {
    const slide = { ...baseSlide, custom_background_path: 'uploads/photo.jpg', background_scale: 1.5 }
    const html = buildSlideHTML({ slide, allSlides: [slide], settings: baseSettings, baseUrl: 'http://localhost:3001' })
    expect(html).toContain('transform:scale(1.5)')
  })

  it('encodes file path in background url', () => {
    const slide = { ...baseSlide, custom_background_path: 'uploads/my photo.jpg' }
    const html = buildSlideHTML({ slide, allSlides: [slide], settings: baseSettings, baseUrl: 'http://localhost:3001' })
    expect(html).toContain('my%20photo.jpg')
  })
})

describe('buildSlideHTML - HTML text passthrough', () => {
  it('renders plain text directly (backward compat - plain text is valid HTML)', () => {
    const html = buildSlideHTML({ slide: baseSlide, allSlides: [baseSlide], settings: baseSettings, baseUrl: 'http://localhost:3001' })
    expect(html).toContain('Test Hook')
    expect(html).toContain('Test Body')
  })

  it('passes HTML through from Tiptap (no escaping)', () => {
    const slide = { ...baseSlide, hook_text: '<strong>Bold Hook</strong>' }
    const html = buildSlideHTML({ slide, allSlides: [slide], settings: baseSettings, baseUrl: 'http://localhost:3001' })
    expect(html).toContain('<strong>Bold Hook</strong>')
  })
})

describe('buildSlideHTML - zone position overrides', () => {
  it('uses default full-width positioning when no posLeft/posWidth set', () => {
    const html = buildSlideHTML({ slide: baseSlide, allSlides: [baseSlide], settings: baseSettings, baseUrl: 'http://localhost:3001' })
    expect(html).toContain('left:0;right:0;')
  })

  it('uses posTop override for vertical position', () => {
    const slide = { ...baseSlide, zone_overrides: { hook: { posTop: 100 } } }
    const html = buildSlideHTML({ slide, allSlides: [slide], settings: baseSettings, baseUrl: 'http://localhost:3001' })
    expect(html).toContain('top:100px;')
  })

  it('uses posLeft + posWidth for horizontal position override', () => {
    const slide = { ...baseSlide, zone_overrides: { body: { posLeft: 50, posWidth: 400 } } }
    const html = buildSlideHTML({ slide, allSlides: [slide], settings: baseSettings, baseUrl: 'http://localhost:3001' })
    // Body zone uses explicit position
    expect(html).toContain('left:50px;width:400px;')
    // Body zone should NOT use right:0 — verify by checking the body zone div structure
    expect(html).toContain('top:280px;left:50px;width:400px;height:640px;')
  })

  it('uses posHeight override for zone height', () => {
    const slide = { ...baseSlide, zone_overrides: { body: { posHeight: 200 } } }
    const html = buildSlideHTML({ slide, allSlides: [slide], settings: baseSettings, baseUrl: 'http://localhost:3001' })
    expect(html).toContain('height:200px;')
  })

  it('applies fontStyle, lineHeight, letterSpacing from override', () => {
    const slide = { ...baseSlide, zone_overrides: { hook: { fontStyle: 'italic', lineHeight: 1.8, letterSpacing: 3 } } }
    const html = buildSlideHTML({ slide, allSlides: [slide], settings: baseSettings, baseUrl: 'http://localhost:3001' })
    expect(html).toContain('font-style:italic')
    expect(html).toContain('line-height:1.8')
    expect(html).toContain('letter-spacing:3px')
  })
})
