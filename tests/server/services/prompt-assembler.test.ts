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
  themes: [],
  mechanics: [
    {
      id: 'm1',
      name: 'Educational',
      description: 'Teach something useful',
      slideRange: { min: 3, max: 7 }
    }
  ]
}

describe('assemblePrompt', () => {
  it('includes non-empty context docs with headers', () => {
    const settings = {
      ...baseSettings,
      contextDocs: { ...baseSettings.contextDocs, brandVoice: 'Direct and concise' }
    }
    const result = assemblePrompt('Pillar A', 'Theme X', 'Educational', '', settings, 'single')
    expect(result).toContain('## Brand Voice')
    expect(result).toContain('Direct and concise')
  })

  it('skips empty context docs', () => {
    const result = assemblePrompt('Pillar A', 'Theme X', 'Educational', '', baseSettings, 'single')
    expect(result).not.toContain('## Brand Voice')
    expect(result).not.toContain('## Target Persona')
  })

  it('includes content focus with pillar and theme', () => {
    const result = assemblePrompt('Growth', 'AI Tools', 'Educational', '', baseSettings, 'carousel')
    expect(result).toContain('## Content Focus')
    expect(result).toContain('**Pillar:** Growth')
    expect(result).toContain('**Theme:** AI Tools')
  })

  it('includes mechanic section when mechanic is found in settings', () => {
    const result = assemblePrompt('Pillar', 'Theme', 'Educational', '', baseSettings, 'carousel')
    expect(result).toContain('## Post Mechanic: Educational')
    expect(result).toContain('Teach something useful')
    expect(result).toContain('**Slide Range:** 3-7 slides')
  })

  it('single post: output instruction requires exactly 1 slide with type cover', () => {
    const result = assemblePrompt('P', 'T', 'Educational', '', baseSettings, 'single')
    expect(result).toContain('EXACTLY 1 slide')
    expect(result).toContain('"slide_type":"cover"')
    expect(result).not.toContain('"slide_type":"content"')
  })

  it('carousel: output instruction includes cover/content/cta slide types', () => {
    const result = assemblePrompt('P', 'T', 'Educational', '', baseSettings, 'carousel')
    expect(result).toContain('"slide_type":"cover"')
    expect(result).toContain('"slide_type":"content"')
    expect(result).toContain('"slide_type":"cta"')
  })

  it('includes impulse section when impulse is non-empty', () => {
    const result = assemblePrompt('P', 'T', 'Educational', 'Focus on beginners', baseSettings, 'single')
    expect(result).toContain('## Additional Guidance')
    expect(result).toContain('Focus on beginners')
  })

  it('truncates prompt when context docs exceed 32000 chars and appends marker', () => {
    const longDoc = 'x'.repeat(40000)
    const settings = {
      ...baseSettings,
      contextDocs: { ...baseSettings.contextDocs, brandVoice: longDoc }
    }
    const result = assemblePrompt('P', 'T', 'Educational', '', settings, 'single')
    // Without truncation, length would be 40000+. With truncation it is ~32000 + marker + JSON instruction.
    expect(result.length).toBeLessThan(40000)
    expect(result).toContain('[Context truncated due to length]')
  })
})
