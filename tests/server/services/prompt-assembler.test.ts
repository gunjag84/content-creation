import { describe, it, expect } from 'vitest'
import { assemblePrompt } from '../../../src/server/services/prompt-assembler'
import type { Settings } from '../../../src/shared/types'

const baseSettings: Settings = {
  contextDocs: {
    brandVoice: '',
    targetPersona: '',
    productUVP: '',
    competitive: '',
    hooks: '',
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
  contentDefaults: { captionMinChars: 50, captionMaxChars: 400, bodyMaxChars: 300 }
}

describe('assemblePrompt', () => {
  // Section 1: Role & Creative Brief
  it('includes role brief with Jule identity', () => {
    const result = assemblePrompt('Generate Demand', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'single')
    expect(result).toContain('Du bist Jule')
    expect(result).toContain('M1 Provokante These Post ueber L3 Alltagschaos')
    expect(result).toContain('Generate Demand')
  })

  it('includes product rules (phone, frequency, facts)', () => {
    const result = assemblePrompt('Generate Demand', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'single')
    expect(result).toContain('WICHTIGE PRODUKTREGELN')
    expect(result).toContain('Handy kommt NICHT mit ins Schlafzimmer')
    expect(result).toContain('NICHT taeglich')
    expect(result).toContain('verifizierbare, recherchierte Daten')
  })

  it('includes approach in brief when provided', () => {
    const result = assemblePrompt('Generate Demand', 'L3 Alltagschaos', 'A1 Dankbarkeit', 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'carousel')
    expect(result).toContain('durch A1 Dankbarkeit')
  })

  it('omits approach from brief when null', () => {
    const result = assemblePrompt('Generate Demand', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'carousel')
    expect(result).not.toContain('durch null')
    expect(result).not.toContain('durch undefined')
  })

  // Section 2: Chain-of-Thought
  it('includes chain-of-thought planning instructions', () => {
    const result = assemblePrompt('Generate Demand', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'single')
    expect(result).toContain('Bevor Du schreibst - plane intern')
    expect(result).toContain('EINE zentrale Erkenntnis')
  })

  // Section 3: Hook Rules
  it('includes hook rules with method-specific formula', () => {
    const result = assemblePrompt('Generate Demand', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'single')
    expect(result).toContain('Hook-Regeln')
    expect(result).toContain('In 3 Sekunden zum Stoppen bringen')
    expect(result).toContain('Strong claim that challenges')
  })

  it('includes tonality modifier for hooks', () => {
    const result = assemblePrompt('Generate Demand', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'single')
    expect(result).toContain('Lean into vulnerability')
  })

  // Section 4: Method Structure
  it('includes method structure for carousel', () => {
    const result = assemblePrompt('Generate Demand', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'carousel')
    expect(result).toContain('Methoden-Struktur: M1 Provokante These')
    expect(result).toContain('Bold claim that provokes')
    expect(result).toContain('Emotionaler Bogen')
  })

  it('uses single structure for single posts', () => {
    const result = assemblePrompt('Generate Demand', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'single')
    expect(result).toContain('Single:')
    expect(result).toContain('Quick evidence + twist')
  })

  // Section 5: Tonality Guide
  it('includes tonality with writing rules', () => {
    const result = assemblePrompt('Generate Demand', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'single')
    expect(result).toContain('Tonalitaet: T1 Emotional')
    expect(result).toContain('Gefuehl vor Fakt')
  })

  // Section 6: Pillar CTA Calibration
  it('includes Generate Demand CTA rules (no product)', () => {
    const result = assemblePrompt('Generate Demand', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'single')
    expect(result).toContain('CTA-Kalibrierung: Generate Demand')
    expect(result).toContain('KEIN Produktbezug. Null')
    expect(result).toContain('Speicher Dir das')
  })

  it('includes Convert Demand CTA rules (product as invitation)', () => {
    const result = assemblePrompt('Convert Demand', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'carousel')
    expect(result).toContain('CTA-Kalibrierung: Convert Demand')
    expect(result).toContain('Einladung, nie als Pitch')
    expect(result).toContain('Link in Bio')
  })

  it('includes Nurture Loyalty CTA rules (engagement)', () => {
    const result = assemblePrompt('Nurture Loyalty', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'single')
    expect(result).toContain('CTA-Kalibrierung: Nurture Loyalty')
    expect(result).toContain('Community staerken')
  })

  // Section 7: Content Focus
  it('includes area in content focus', () => {
    const result = assemblePrompt('Generate Demand', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'carousel')
    expect(result).toContain('Inhaltlicher Fokus')
    expect(result).toContain('L3 Alltagschaos')
    expect(result).toContain('Daily chaos of working parents')
  })

  it('includes approach in content focus when provided', () => {
    const result = assemblePrompt('Generate Demand', 'L3 Alltagschaos', 'A1 Dankbarkeit', 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'carousel')
    expect(result).toContain('Loesungsansatz: A1 Dankbarkeit')
    expect(result).toContain('Gratitude practice')
  })

  // Section 8: Anti-Patterns
  it('includes anti-patterns section', () => {
    const result = assemblePrompt('Generate Demand', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'single')
    expect(result).toContain('Verboten - NIEMALS verwenden')
    expect(result).toContain('Kennst du das auch')
    expect(result).toContain('Keine Gedankenstriche')
  })

  // Section 9: Caption Rules
  it('includes caption rules with char limits from settings', () => {
    const result = assemblePrompt('Generate Demand', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'single')
    expect(result).toContain('Caption-Regeln')
    expect(result).toContain('eigenstaendiges Stueck Content')
    expect(result).toContain('50-400 Zeichen')
  })

  // Section 10: Content Constraints & Output Format
  it('single post requires exactly 1 slide', () => {
    const result = assemblePrompt('Generate Demand', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'single')
    expect(result).toContain('GENAU 1 Slide')
    expect(result).toContain('"slide_type":"cover"')
  })

  it('carousel requires exact slide count with cover/content/cta types', () => {
    const result = assemblePrompt('Generate Demand', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'carousel', 6)
    expect(result).toContain('GENAU 6 Slides')
    expect(result).toContain('"slide_type":"cover"')
    expect(result).toContain('"slide_type":"content"')
    expect(result).toContain('"slide_type":"cta"')
  })

  it('includes strong character limit language', () => {
    const result = assemblePrompt('Generate Demand', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'single')
    expect(result).toContain('HARTE ZEICHENLIMITS')
    expect(result).toContain('wird abgeschnitten und zerstoert den Post')
    expect(result).toContain('MAXIMAL 300 Zeichen')
  })

  // Section 12: Impulse
  it('includes impulse when provided', () => {
    const result = assemblePrompt('Generate Demand', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', 'Focus on beginners', baseSettings, 'single')
    expect(result).toContain('Zusaetzliche Anweisung')
    expect(result).toContain('Focus on beginners')
  })

  it('omits impulse section when empty', () => {
    const result = assemblePrompt('Generate Demand', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', baseSettings, 'single')
    expect(result).not.toContain('Zusaetzliche Anweisung')
  })

  // Truncation
  it('truncates prompt when exceeding 32000 chars', () => {
    const settings = {
      ...baseSettings,
      areas: [{ id: 'a1', name: 'L3 Alltagschaos', description: 'x'.repeat(30000) }]
    }
    const result = assemblePrompt('Generate Demand', 'L3 Alltagschaos', null, 'M1 Provokante These', 'T1 Emotional', '', settings, 'single')
    expect(result.length).toBeLessThan(40000)
    expect(result).toContain('[Context truncated due to length]')
  })
})
