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
      pillars: [{ id: 'p1', name: 'Growth', targetPct: 60 }],
      areas: [{ id: 'a1', name: 'L1 Familienleben', description: 'Family life' }],
      approaches: [{ id: 'ap1', name: 'A1 Dankbarkeit' }],
      methods: [{ id: 'm1', name: 'M1 Provokante These', description: 'Bold claim', formatConstraints: ['single', 'carousel'] }],
      tonalities: [{ id: 't1', name: 'T1 Emotional' }],
      blacklist: [{ dimension1: 'method', value1: 'M5', dimension2: 'tonality', value2: 'T2', severity: 'hard' }]
    }
    const result = SettingsSchema.parse(input)
    expect(result.pillars[0].name).toBe('Growth')
    expect(result.areas[0].description).toBe('Family life')
    expect(result.methods[0].formatConstraints).toEqual(['single', 'carousel'])
    expect(result.blacklist[0].severity).toBe('hard')
  })

  it('applies defaults for missing optional fields', () => {
    const result = SettingsSchema.parse({})
    expect(result.contextDocs.brandVoice).toBe('')
    expect(result.pillars).toEqual([])
    expect(result.areas).toEqual([])
    expect(result.approaches).toEqual([])
    expect(result.methods).toEqual([])
    expect(result.tonalities).toEqual([])
    expect(result.blacklist).toEqual([])
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

  it('parses blacklist entry with hard severity', () => {
    const result = SettingsSchema.parse({
      blacklist: [{ dimension1: 'method', value1: 'M5', dimension2: 'tonality', value2: 'T2', severity: 'hard' }]
    })
    expect(result.blacklist[0].severity).toBe('hard')
  })

  it('rejects blacklist with invalid severity', () => {
    expect(() => SettingsSchema.parse({
      blacklist: [{ dimension1: 'method', value1: 'M5', dimension2: 'tonality', value2: 'T2', severity: 'medium' }]
    })).toThrow()
  })
})
