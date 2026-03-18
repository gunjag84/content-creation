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
        contentStrategy: 'Value first',
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
      themes: [{ id: 't1', name: 'AI Tools' }],
      mechanics: [{ id: 'm1', name: 'Tutorial', description: 'Step by step', slideRange: { min: 3, max: 7 } }]
    }
    const result = SettingsSchema.parse(input)
    expect(result.contextDocs.brandVoice).toBe('Direct')
    expect(result.pillars[0].name).toBe('Growth')
    expect(result.mechanics[0].slideRange!.min).toBe(3)
  })

  it('applies defaults for missing optional fields', () => {
    const result = SettingsSchema.parse({})
    expect(result.contextDocs.brandVoice).toBe('')
    expect(result.contextDocs.pov).toBe('')
    expect(result.visual.colors).toEqual(['#000000', '#666666', '#ffffff'])
    expect(result.pillars).toEqual([])
    expect(result.themes).toEqual([])
    expect(result.mechanics).toEqual([])
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
})
