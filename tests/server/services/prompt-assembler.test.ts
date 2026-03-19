import { describe, it, expect } from 'vitest'
import { assemblePrompt } from '../../../src/server/services/prompt-assembler'
import type { Settings } from '../../../src/shared/types'

const baseSettings: Settings = {
  contextDocs: {
    brandVoice: '',
    targetPersona: '',
    productUVP: '',
    competitive: '',
    contentStrategy: '',
    pov: ''
  },
  visual: {
    colors: ['#000000', '#666666', '#ffffff'],
    fonts: { headline: '', body: '', cta: '' },
    logo: '',
    cta: 'Follow us',
    handle: '@brand'
  },
  pillars: [],
  areas: [{ id: 'a1', name: 'L3 Alltagschaos', description: 'Daily chaos of working parents' }],
  approaches: [{ id: 'ap1', name: 'A1 Dankbarkeit', description: 'Gratitude practice' }],
  methods: [{ id: 'm1', name: 'M1 Provokante These', description: 'Start with a bold claim' }],
  tonalities: [{ id: 't1', name: 'T1 Emotional', description: 'Warm and empathetic tone' }],
  blacklist: [],
  contentDefaults: { captionMinChars: 50, captionMaxChars: 400, bodyMaxChars: 400 }
}

describe('assemblePrompt', () => {
  it('includes non-empty context docs with headers', () => {
    const settings = {
      ...baseSettings,
      contextDocs: { ...baseSettings.contextDocs, brandVoice: 'Direct and concise' }
    }
    const result = assemblePrompt('Pillar A', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', settings, 'single')
    expect(result).toContain('## Brand Voice')
    expect(result).toContain('Direct and concise')
  })

  it('skips empty context docs', () => {
    const result = assemblePrompt('Pillar A', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'single')
    expect(result).not.toContain('## Brand Voice')
  })

  it('includes area in content focus', () => {
    const result = assemblePrompt('Growth', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'carousel')
    expect(result).toContain('## Content Focus')
    expect(result).toContain('L3 Alltagschaos')
    expect(result).toContain('Daily chaos of working parents')
  })

  it('includes approach when provided', () => {
    const result = assemblePrompt('Growth', 'L3 Alltagschaos', 'A1 Dankbarkeit', 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'carousel')
    expect(result).toContain('A1 Dankbarkeit')
    expect(result).toContain('Gratitude practice')
  })

  it('omits approach when null', () => {
    const result = assemblePrompt('Growth', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'carousel')
    expect(result).not.toContain('Loesungsansatz')
  })

  it('includes method section', () => {
    const result = assemblePrompt('P', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'carousel')
    expect(result).toContain('## Method: M1 Provokante These')
    expect(result).toContain('Start with a bold claim')
  })

  it('includes tonality section', () => {
    const result = assemblePrompt('P', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'carousel')
    expect(result).toContain('## Tonality: T1 Emotional')
    expect(result).toContain('Warm and empathetic tone')
  })

  it('single post output format requires exactly 1 slide', () => {
    const result = assemblePrompt('P', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'single')
    expect(result).toContain('EXACTLY 1 slide')
  })

  it('carousel output includes cover/content/cta slide types', () => {
    const result = assemblePrompt('P', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'carousel')
    expect(result).toContain('"slide_type":"cover"')
    expect(result).toContain('"slide_type":"content"')
    expect(result).toContain('"slide_type":"cta"')
  })

  it('includes impulse section when non-empty', () => {
    const result = assemblePrompt('P', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', 'Focus on beginners', baseSettings, 'single')
    expect(result).toContain('## Additional Guidance')
    expect(result).toContain('Focus on beginners')
  })

  it('includes pillar rules when defined', () => {
    const settings = {
      ...baseSettings,
      pillars: [{ id: 'p1', name: 'Growth', targetPct: 50, rules: 'Never mention the product' }]
    }
    const result = assemblePrompt('Growth', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', settings, 'single')
    expect(result).toContain('**Pillar Rules (MUST follow):**')
    expect(result).toContain('Never mention the product')
  })

  it('truncates prompt when context docs exceed 32000 chars', () => {
    const longDoc = 'x'.repeat(40000)
    const settings = {
      ...baseSettings,
      contextDocs: { ...baseSettings.contextDocs, brandVoice: longDoc }
    }
    const result = assemblePrompt('P', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', settings, 'single')
    expect(result.length).toBeLessThan(40000)
    expect(result).toContain('[Context truncated due to length]')
  })
})
