import { describe, it, expect } from 'vitest'
import { SettingsSchema } from '../../src/shared/types'

describe('SettingsSchema', () => {
  it('parses a valid full settings object', () => {
    const input = {
      contextDocs: {
        brandVoice: 'Direct',
        targetPersona: 'Founders',
        productUVP: 'Best product',
        competitive: 'Niche player',
        hooks: 'Value first',
        pov: 'AI is a tool'
      },
      visual: {
        colors: ['#111', '#222', '#333'],
        fonts: { headline: 'fonts/h.ttf', body: 'fonts/b.ttf', cta: 'fonts/c.ttf' },
        logo: 'logos/logo.png',
        cta: 'Follow us',
        handle: '@brand'
      },
      pillars: [{
        id: 'p1',
        name: 'Growth',
        targetPct: 60,
        promise: 'Help founders grow',
        brief: 'Short brief',
        tone: 'Confident',
        desiredFeeling: 'Inspired',
        production: { formats: 'carousel', visualStyle: 'bold', captionRules: 'short' },
        scenarios: [{ id: 's1', name: 'Founder story', description: 'Personal journey', antiPatterns: 'No fluff', allowedMethods: ['m1'] }],
        goals: { business: 'Leads', communication: 'Authority' }
      }],
      methods: [{ id: 'm1', name: 'M1 Provokante These', description: 'Bold claim', formatConstraints: ['single', 'carousel'] }],
      situationLibrary: [{ id: 'sit1', text: 'Working late again', scenarioIds: ['s1'], imageIds: [] }],
      scienceLibrary: [{ id: 'sci1', claim: 'Sleep deprivation reduces productivity', source: 'Study 2023', scenarioIds: ['s1'] }],
      situationImageLibrary: [{ id: 'img1', filename: 'desk.jpg', label: 'Desk at night' }]
    }
    const result = SettingsSchema.parse(input)
    expect(result.pillars[0].name).toBe('Growth')
    expect(result.pillars[0].scenarios[0].name).toBe('Founder story')
    expect(result.methods[0].formatConstraints).toEqual(['single', 'carousel'])
    expect(result.situationLibrary[0].text).toBe('Working late again')
    expect(result.scienceLibrary[0].claim).toBe('Sleep deprivation reduces productivity')
    expect(result.situationImageLibrary[0].filename).toBe('desk.jpg')
  })

  it('applies defaults for missing optional fields', () => {
    const result = SettingsSchema.parse({})
    expect(result.contextDocs.brandVoice).toBe('')
    expect(result.pillars).toEqual([])
    expect(result.methods).toEqual([])
    expect(result.situationLibrary).toEqual([])
    expect(result.scienceLibrary).toEqual([])
    expect(result.situationImageLibrary).toEqual([])
    expect(result.hookLibrary).toEqual([])
    expect(result.ctaLibrary).toEqual([])
  })

  it('rejects pillar with targetPct out of range', () => {
    expect(() => SettingsSchema.parse({
      pillars: [{ id: 'p1', name: 'Growth', targetPct: 150 }]
    })).toThrow()
  })

  it('rejects pillar with negative targetPct', () => {
    expect(() => SettingsSchema.parse({
      pillars: [{ id: 'p1', name: 'Growth', targetPct: -10 }]
    })).toThrow()
  })

  it('parses method with formatConstraints', () => {
    const result = SettingsSchema.parse({
      methods: [{ id: 'm1', name: 'M6 Zitat', formatConstraints: ['single'] }]
    })
    expect(result.methods[0].formatConstraints).toEqual(['single'])
  })

  it('parses pillar with scenarios and defaults empty arrays', () => {
    const result = SettingsSchema.parse({
      pillars: [{ id: 'p1', name: 'Growth', targetPct: 50 }]
    })
    expect(result.pillars[0].scenarios).toEqual([])
    expect(result.pillars[0].promise).toBe('')
    expect(result.pillars[0].tone).toBe('')
  })

  it('parses LibraryItem with scenarioIds', () => {
    const result = SettingsSchema.parse({
      hookLibrary: [{ id: 'h1', text: 'Did you know...', scenarioIds: ['s1', 's2'] }]
    })
    expect(result.hookLibrary[0].scenarioIds).toEqual(['s1', 's2'])
  })

  it('parses contentDefaults with generationFields', () => {
    const result = SettingsSchema.parse({
      contentDefaults: {
        captionMinChars: 100,
        captionMaxChars: 300,
        bodyMaxChars: 200,
        generationFields: {
          single: 'hook_body',
          carouselCover: 'all',
          carouselContent: 'body_only',
          carouselCta: 'hook_only'
        }
      }
    })
    expect(result.contentDefaults.generationFields.single).toBe('hook_body')
    expect(result.contentDefaults.generationFields.carouselContent).toBe('body_only')
  })
})
