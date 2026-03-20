import { describe, it, expect } from 'vitest'
import { assemblePrompt } from '../../../src/server/services/prompt-assembler'
import type { Settings } from '../../../src/shared/types'

const baseSettings: Settings = {
  contextDocs: {
    brandVoice: 'Wie eine Freundin beim Kaffee. Warm, persoenlich.',
    targetPersona: 'Berufstaetige Muetter (35-45), DACH.',
    productUVP: 'LEBEN.LIEBEN Dankbarkeitstagebuch. 100 Eintraege.',
    competitive: 'Differenzierung: WEIL3 geht tiefer.',
    hooks: 'Der Hook ist schaerfer als die Brand Voice. Ziel: Scroll stoppen.',
    pov: '1. Die Welt braucht Erlaubnis, langsamer zu machen.\n2. Analog ist bewusste Rebellion.\n3. Tiefe schlaegt Breite.'
  },
  visual: {
    colors: ['#000000', '#666666', '#ffffff'],
    fonts: { headline: '', body: '', cta: '' },
    fontSizes: { headline: 56, body: 38, cta: 48 },
    fontLibrary: [],
    imageLibrary: [],
    logo: '',
    cta: 'Follow us',
    handle: '@brand'
  },
  pillars: [
    {
      id: 'p1', name: 'Generate Demand', targetPct: 65,
      promise: 'Entdecke die Schoenheit in Deinem Leben.',
      brief: 'Emotionale Resonanz, kein Produkt.',
      tone: 'Warm, motivierend, nie belehrend.',
      desiredFeeling: 'Gesehen und verstanden.',
      production: {
        formats: 'Reels, Stories',
        visualStyle: 'Weiches natuerliches Licht',
        captionRules: 'So kurz wie moeglich, immer mit Share-CTA.'
      },
      scenarios: [
        { id: 'gd-a1', name: 'Realitaet berufstaetiger Muetter', description: 'Gelebte Erfahrung validieren.', antiPatterns: 'Poliert oder inauthentisch.', allowedMethods: ['M1 Provokante These'] }
      ],
      goals: { business: 'Awareness', communication: 'Audience Growth' }
    },
    {
      id: 'p2', name: 'Convert Demand', targetPct: 25,
      promise: 'Die Kraft des Deep Gratitude Rituals.',
      brief: 'Produkt zeigen, Nutzen erklaeren.',
      tone: 'Klar, empathisch, selbstbewusst.',
      desiredFeeling: 'Informiert und ueberzeugt.',
      production: { formats: '', visualStyle: '', captionRules: 'Kurz mit klarem CTA zum Shop.' },
      scenarios: [
        { id: 'cd-a1', name: 'Produkt-zentriertes Storytelling', description: 'Journal zeigen.', antiPatterns: 'Hartes Verkaufen.', allowedMethods: ['M1 Provokante These'] }
      ],
      goals: { business: 'Conversion', communication: 'Sales' }
    },
    {
      id: 'p3', name: 'Nurture Loyalty', targetPct: 10,
      promise: 'Zuflucht fuer echte Heldinnen.',
      brief: 'Community staerken.',
      tone: 'Warm, authentisch, transparent.',
      desiredFeeling: 'Wertgeschaetzt und bestärkt.',
      production: { formats: '', visualStyle: '', captionRules: '' },
      scenarios: [
        { id: 'nl-a1', name: 'Gruenderin und Verletzlichkeit', description: 'Authentische Geschichten.', antiPatterns: 'Korporat.', allowedMethods: ['M1 Provokante These'] }
      ],
      goals: { business: 'CLV', communication: 'Loyalitaet' }
    }
  ],
  methods: [{ id: 'm1', name: 'M1 Provokante These', description: 'Start with a bold claim' }],
  contentDefaults: {
    captionMinChars: 50, captionMaxChars: 400, bodyMaxChars: 300,
    generationFields: { single: 'all', carouselCover: 'all', carouselContent: 'all', carouselCta: 'all' }
  },
  hookLibrary: [],
  ctaLibrary: [],
  situationLibrary: [],
  scienceLibrary: [],
  situationImageLibrary: []
}

function gen(pillar = 'Generate Demand', scenario = 'Realitaet berufstaetiger Muetter', method = 'M1 Provokante These', contentType: 'single' | 'carousel' = 'single', slideCount?: number) {
  return assemblePrompt(pillar, scenario, method, baseSettings, contentType, slideCount)
}

describe('assemblePrompt - 5-block anatomy', () => {
  // Block 1: TASK
  it('starts with task block containing method, scenario, pillar', () => {
    const result = gen()
    expect(result).toContain('# 1. TASK')
    expect(result).toContain('M1 Provokante These')
    expect(result).toContain('Realitaet berufstaetiger Muetter')
    expect(result).toContain('Generate Demand')
  })

  it('includes pillar promise as success criteria', () => {
    const result = gen()
    expect(result).toContain('Entdecke die Schoenheit in Deinem Leben')
  })

  it('includes chain-of-thought planning in task', () => {
    const result = gen()
    expect(result).toContain('EINE zentrale Erkenntnis')
  })

  it('includes prompt guidance when provided', () => {
    const result = assemblePrompt('Generate Demand', 'Realitaet berufstaetiger Muetter', 'M1 Provokante These', baseSettings, 'single', undefined, undefined, undefined, undefined, undefined, 'Echte Situation vom Montag')
    expect(result).toContain('PROMPT GUIDANCE')
    expect(result).toContain('Echte Situation vom Montag')
  })

  it('omits prompt guidance when empty', () => {
    const result = gen()
    expect(result).not.toContain('PROMPT GUIDANCE')
  })

  // Block 2: CONTEXT
  it('includes brand voice in context', () => {
    const result = gen()
    expect(result).toContain('# 2. CONTEXT')
    expect(result).toContain('Wie eine Freundin beim Kaffee')
  })

  it('includes target persona in context', () => {
    const result = gen()
    expect(result).toContain('Berufstaetige Muetter (35-45)')
  })

  it('includes product UVP in context', () => {
    const result = gen()
    expect(result).toContain('LEBEN.LIEBEN Dankbarkeitstagebuch')
  })

  it('includes product rules in context', () => {
    const result = gen()
    expect(result).toContain('Produktregeln')
    expect(result).toContain('NICHT taeglich')
  })

  it('includes POV in context block', () => {
    const result = gen()
    expect(result).toContain('Kern-Ueberzeugungen')
    expect(result).toContain('NICHTS in Deiner Antwort darf diesen widersprechen')
    expect(result).toContain('Tiefe schlaegt Breite')
  })

  it('omits POV when contextDocs.pov is empty', () => {
    const settings = { ...baseSettings, contextDocs: { ...baseSettings.contextDocs, pov: '' } }
    const result = assemblePrompt('Generate Demand', 'Realitaet berufstaetiger Muetter', 'M1 Provokante These', settings, 'single')
    expect(result).not.toContain('Kern-Ueberzeugungen')
  })

  // Block 3: REFERENCE
  it('includes method structure in reference', () => {
    const result = gen('Generate Demand', 'Realitaet berufstaetiger Muetter', 'M1 Provokante These', 'carousel')
    expect(result).toContain('# 3. REFERENCE')
    expect(result).toContain('Methoden-Struktur: M1 Provokante These')
    expect(result).toContain('Emotionaler Bogen')
  })

  it('includes hook formula in reference', () => {
    const result = gen()
    expect(result).toContain('Hook-Formel')
    expect(result).toContain('Scroll stoppen')
  })

  it('includes Generate Demand CTA rules (no product)', () => {
    const result = gen()
    expect(result).toContain('CTA-Kalibrierung: Generate Demand')
    expect(result).toContain('KEIN Produktbezug')
  })

  it('includes Convert Demand CTA rules', () => {
    const result = gen('Convert Demand', 'Produkt-zentriertes Storytelling')
    expect(result).toContain('CTA-Kalibrierung: Convert Demand')
  })

  it('includes Nurture Loyalty CTA rules', () => {
    const result = gen('Nurture Loyalty', 'Gruenderin und Verletzlichkeit')
    expect(result).toContain('CTA-Kalibrierung: Nurture Loyalty')
    expect(result).toContain('Community staerken')
  })

  it('includes library hook/cta context when provided', () => {
    const result = assemblePrompt('Generate Demand', 'Realitaet berufstaetiger Muetter', 'M1 Provokante These', baseSettings, 'single', undefined, 'Dein Handy ist Dein letzter Gedanke', 'Speicher Dir das')
    expect(result).toContain('Vorgegebener Hook')
    expect(result).toContain('Dein Handy ist Dein letzter Gedanke')
    expect(result).toContain('Vorgegebener CTA')
    expect(result).toContain('Speicher Dir das')
  })

  it('includes situation library item when provided', () => {
    const result = assemblePrompt('Generate Demand', 'Realitaet berufstaetiger Muetter', 'M1 Provokante These', baseSettings, 'single', undefined, undefined, undefined, 'Montag morgen, Kinder streiten')
    expect(result).toContain('Vorgegebene Situation')
    expect(result).toContain('Montag morgen, Kinder streiten')
  })

  it('includes science library item when provided', () => {
    const result = assemblePrompt('Generate Demand', 'Realitaet berufstaetiger Muetter', 'M1 Provokante These', baseSettings, 'single', undefined, undefined, undefined, undefined, 'Emmons: 25% gluecklicher')
    expect(result).toContain('Wissenschaftlicher Fakt')
    expect(result).toContain('Emmons: 25% gluecklicher')
  })

  // Block 4: BRIEF
  it('includes pillar brief and tone in brief block', () => {
    const result = gen()
    expect(result).toContain('# 4. BRIEF')
    expect(result).toContain('Emotionale Resonanz, kein Produkt')
    expect(result).toContain('Warm, motivierend, nie belehrend')
  })

  it('includes desired feeling in brief', () => {
    const result = gen()
    expect(result).toContain('Gesehen und verstanden')
  })

  it('includes scenario focus in brief', () => {
    const result = gen()
    expect(result).toContain('Realitaet berufstaetiger Muetter')
    expect(result).toContain('Gelebte Erfahrung validieren')
  })

  it('includes caption rules in brief', () => {
    const result = gen()
    expect(result).toContain('50-400 Zeichen')
  })

  it('includes pillar-specific caption rules when present', () => {
    const result = gen()
    expect(result).toContain('PILLAR-SPEZIFISCH')
    expect(result).toContain('So kurz wie moeglich')
  })

  it('omits pillar caption rules when empty', () => {
    const result = gen('Nurture Loyalty', 'Gruenderin und Verletzlichkeit')
    expect(result).not.toContain('PILLAR-SPEZIFISCH')
  })

  // Block 5: RULES
  it('includes anti-patterns with scenario-specific patterns', () => {
    const result = gen()
    expect(result).toContain('# 5. RULES')
    expect(result).toContain('Verboten - NIEMALS verwenden')
    expect(result).toContain('Poliert oder inauthentisch')
  })

  it('includes hard character limits', () => {
    const result = gen()
    expect(result).toContain('HARTE ZEICHENLIMITS')
    expect(result).toContain('MAXIMAL 300 Zeichen')
  })

  it('single post requires exactly 1 slide', () => {
    const result = gen()
    expect(result).toContain('GENAU 1 Slide')
    expect(result).toContain('"slide_type":"cover"')
  })

  it('carousel requires exact slide count', () => {
    const result = gen('Generate Demand', 'Realitaet berufstaetiger Muetter', 'M1 Provokante These', 'carousel', 6)
    expect(result).toContain('GENAU 6 Slides')
  })

  it('includes zone separation rules', () => {
    const result = gen()
    expect(result).toContain('ZONEN-TRENNUNG')
    expect(result).toContain('hook_text und erster Satz von body_text sagen das Gleiche')
    expect(result).toContain('Letzter Satz von body_text und cta_text sagen das Gleiche')
  })

  // Structural
  it('uses 5-block structure with separators', () => {
    const result = gen()
    expect(result).toContain('# 1. TASK')
    expect(result).toContain('# 2. CONTEXT')
    expect(result).toContain('# 3. REFERENCE')
    expect(result).toContain('# 4. BRIEF')
    expect(result).toContain('# 5. RULES')
  })

  it('prompt guidance appears in brief block', () => {
    const result = assemblePrompt('Generate Demand', 'Realitaet berufstaetiger Muetter', 'M1 Provokante These', baseSettings, 'single', undefined, undefined, undefined, undefined, undefined, 'Schreibe ueber Schlafrituale')
    const briefIdx = result.indexOf('# 4. BRIEF')
    const guidanceIdx = result.indexOf('PROMPT GUIDANCE')
    const rulesIdx = result.indexOf('# 5. RULES')
    expect(guidanceIdx).toBeGreaterThan(briefIdx)
    expect(guidanceIdx).toBeLessThan(rulesIdx)
  })

  // Truncation
  it('truncates prompt when exceeding 32000 chars', () => {
    const settings: Settings = {
      ...baseSettings,
      contextDocs: { ...baseSettings.contextDocs, brandVoice: 'x'.repeat(30000) }
    }
    const result = assemblePrompt('Generate Demand', 'Realitaet berufstaetiger Muetter', 'M1 Provokante These', settings, 'single')
    expect(result.length).toBeLessThan(40000)
    expect(result).toContain('[Context truncated due to length]')
  })
})
