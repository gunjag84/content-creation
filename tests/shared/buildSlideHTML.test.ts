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

describe('buildSlideHTML - HTML escaping', () => {
  it('escapes < and > in slide text to prevent layout breakage', () => {
    const slide = { ...baseSlide, hook_text: 'AI: 1 < 2 & 3 > 0' }
    const html = buildSlideHTML({ slide, allSlides: [slide], settings: baseSettings, baseUrl: 'http://localhost:3001' })
    expect(html).toContain('1 &lt; 2 &amp; 3 &gt; 0')
    expect(html).not.toContain('1 < 2')
  })

  it('escapes < and > in handle field', () => {
    const settings = { ...baseSettings, visual: { ...baseSettings.visual, handle: '@brand<test>' } }
    const html = buildSlideHTML({ slide: baseSlide, allSlides: [baseSlide], settings, baseUrl: 'http://localhost:3001' })
    expect(html).toContain('@brand&lt;test&gt;')
    expect(html).not.toContain('@brand<test>')
  })

  it('renders clean text unchanged', () => {
    const html = buildSlideHTML({ slide: baseSlide, allSlides: [baseSlide], settings: baseSettings, baseUrl: 'http://localhost:3001' })
    expect(html).toContain('Test Hook')
    expect(html).toContain('Test Body')
  })
})
