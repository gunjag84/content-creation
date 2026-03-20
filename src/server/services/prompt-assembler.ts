import type { Settings } from '../../shared/types'
import {
  methodStructures,
  hookFormulas,
  antiPatterns
} from './prompt-references'

/**
 * Assembles a structured prompt following the 5-block anatomy:
 * 1. TASK - what to do + success criteria
 * 2. CONTEXT - brand knowledge, product, persona (read before starting)
 * 3. REFERENCE - method structure, hook formulas, examples
 * 4. BRIEF - the specific creative brief for this post
 * 5. RULES - hard constraints, anti-patterns, output format
 */
export function assemblePrompt(
  pillar: string,
  scenario: string,
  method: string,
  settings: Settings,
  contentType: 'single' | 'carousel',
  slideCount?: number,
  libraryHook?: string | null,
  libraryCta?: string | null,
  librarySituation?: string | null,
  libraryScience?: string | null,
  impulse?: string
): string {
  const sections: string[] = []
  const defaults = settings.contentDefaults
  const carouselCount = slideCount ?? 5
  const docs = settings.contextDocs

  // Look up dimension entries
  const pillarEntry = settings.pillars.find(p => p.name === pillar)
  const scenarioEntry = pillarEntry?.scenarios.find(s => s.name === scenario)
  const methodEntry = settings.methods.find(m => m.name === method)

  // Extract method ID for structure lookup
  const methodKey = Object.keys(methodStructures).find(k =>
    method.includes(k.split(' ')[0]) || k === method
  )
  const structure = methodKey ? methodStructures[methodKey] : null

  // =====================================================================
  // BLOCK 1: TASK
  // What to do + what success looks like
  // =====================================================================
  const taskLines: string[] = []

  taskLines.push(`Schreibe einen Instagram ${contentType === 'carousel' ? `Carousel (${carouselCount} Slides)` : 'Single Post'} auf Deutsch.
Methode: ${method}. Szenario: ${scenario}. Pillar: ${pillar}.`)

  if (pillarEntry?.promise) {
    taskLines.push(`\nErfolg: ${pillarEntry.promise}`)
  }

  const cotGuidanceHint = (impulse && impulse.trim())
    ? '\nWICHTIG: Wenn eine Prompt Guidance im Brief steht, ist sie Dein Szenen-Anker und Deine kreative Angle. Baue den Post darum herum.'
    : ''

  taskLines.push(`\nBevor Du schreibst, bestimme fuer Dich (nicht im Output):
1. EINE zentrale Erkenntnis, die der Post vermittelt
2. EINE konkrete Alltagsszene als Anker (Wer, wo, wann, was passiert)
3. Das EINE Element, das diesen Post speichernswert macht
4. Den emotionalen Bogen: Wo startet die Leserin, wo soll sie ankommen?${cotGuidanceHint}`)

  sections.push(`# 1. TASK\n\n${taskLines.join('\n')}`)

  // =====================================================================
  // BLOCK 2: CONTEXT
  // Brand knowledge - read completely before writing
  // =====================================================================
  const contextLines: string[] = []
  contextLines.push('Lies diese Kontext-Dokumente vollstaendig bevor Du schreibst.')

  if (docs.brandVoice) {
    contextLines.push(`\n## Stimme\n${docs.brandVoice}`)
  }

  if (docs.productUVP) {
    contextLines.push(`\n## Produkt\n${docs.productUVP}`)
  }

  contextLines.push(`\n## Produktregeln
- Handy nicht mit ins Zimmer nehmen, Journal aufschlagen, Deep Gratitude Ritual machen.
- Die Nutzung ist NICHT taeglich. Alle 3-4 Tage reicht voellig. Formuliere NIE so, dass sich die Leserin verpflichtet fuehlt, jeden Abend zu schreiben. "Wenn Du magst" / "Ab und zu" statt "jeden Abend". Das Journal soll einladen, nie Druck machen.
- Bei Fakten, Zahlen und Studien: NUR verifizierbare, recherchierte Daten verwenden. Nie Zahlen erfinden. Wenn keine belastbare Quelle existiert, formuliere als persoenliche Beobachtung statt als Fakt.`)

  if (docs.targetPersona) {
    contextLines.push(`\n## Zielgruppe\n${docs.targetPersona}`)
  }

  if (docs.pov) {
    contextLines.push(`\n## Kern-Ueberzeugungen (POV)\nNICHTS in Deiner Antwort darf diesen widersprechen. Wenn ein Widerspruch vorliegt, schreibe den betroffenen Teil um.\n\n${docs.pov}`)
  }

  sections.push(`# 2. CONTEXT\n\n${contextLines.join('\n')}`)

  // =====================================================================
  // BLOCK 3: REFERENCE
  // Method structure, hook formula, examples - the patterns to follow
  // =====================================================================
  const refLines: string[] = []

  // Method structure
  if (structure) {
    const structureText = contentType === 'carousel' && structure.carousel
      ? structure.carousel
      : structure.single

    const guidanceNote = (impulse && impulse.trim())
      ? `\n\nHINWEIS: Die Prompt Guidance im Brief bestimmt, WIE diese Methode angewendet wird. Die Slide-Struktur ist ein Geruest - die Guidance liefert die kreative Angle und den Szenen-Anker. Passe die Struktur an die Guidance an, nicht umgekehrt.`
      : ''

    refLines.push(`## Methoden-Struktur: ${method}\n\n${structure.core}\n\n${contentType === 'carousel' ? `Carousel (${carouselCount} slides):` : 'Single:'}\n${structureText}\n\nEmotionaler Bogen: ${structure.arc}${structure.keyRule ? `\n\nWichtige Regel: ${structure.keyRule}` : ''}${guidanceNote}`)
  } else if (methodEntry) {
    refLines.push(`## Methode: ${method}\n${methodEntry.description ?? ''}`)
  }

  // Hook formula
  const hookFormulaText = Object.entries(hookFormulas).find(([k]) =>
    method.includes(k.split(' ')[0]) || k === method
  )?.[1] ?? ''

  const hookRulesIntro = docs.hooks
    ? docs.hooks
    : `Der Hook folgt NICHT der Brand Voice. Er ist schaerfer, direkter, provokanter.
Ziel: In 3 Sekunden zum Stoppen bringen. Konkurrenz ist Netflix, Memes, Freunde.`

  refLines.push(`## Hook-Formel (gilt NUR fuer hook_text auf Slide 1)\n\n${hookRulesIntro}\n\nHook-Formel fuer ${method}:\n${hookFormulaText}`)

  // CTA calibration per pillar
  refLines.push(buildCtaSection(pillar, carouselCount))

  // Library items (pre-selected content to work with)
  if (libraryHook || libraryCta) {
    const libLines: string[] = ['## Vorgegebene Hook/CTA (aus der Bibliothek)', '']
    libLines.push('Diese Texte sind bereits festgelegt und werden nach der Generierung eingesetzt. Schreibe den Body-Text so, dass er inhaltlich dazu passt.')
    if (libraryHook) {
      libLines.push(`\nVorgegebener Hook (Cover-Slide): "${libraryHook}"`)
      libLines.push('Dein body_text auf dem Cover-Slide muss diesen Hook fortfuehren und vertiefen.')
    }
    if (libraryCta) {
      libLines.push(`\nVorgegebener CTA (letzter Slide): "${libraryCta}"`)
      libLines.push('Dein body_text auf dem CTA-Slide muss zu diesem CTA hinfuehren.')
    }
    refLines.push(libLines.join('\n'))
  }

  if (librarySituation) {
    refLines.push(`## Vorgegebene Situation (aus der Bibliothek)\n\nVerwende als Ausgangspunkt oder Inspiration:\n\n${librarySituation}`)
  }

  if (libraryScience) {
    refLines.push(`## Wissenschaftlicher Fakt (aus der Bibliothek)\n\nBaue diesen Fakt in den Post ein, wenn es zum Szenario passt. Zitiere die Quelle beilaeufig:\n\n${libraryScience}`)
  }

  sections.push(`# 3. REFERENCE\n\n${refLines.join('\n\n')}`)

  // =====================================================================
  // BLOCK 4: BRIEF
  // The specific creative brief - pillar tone, scenario, desired feeling
  // =====================================================================
  const briefLines: string[] = []

  // Prompt Guidance - the creative core of this post
  if (impulse && impulse.trim()) {
    briefLines.push(`## PROMPT GUIDANCE - Kreative Angle dieses Posts

${impulse.trim()}

Das ist der kreative Kern. Baue den GESAMTEN Post um diese Angle herum. Jeder Slide dient dieser Angle. Die Methoden-Struktur ist das Geruest, aber diese Guidance bestimmt die Geschichte, den Blickwinkel und den emotionalen Bogen. Erfinde KEINE andere Szene neben der Guidance.`)
  }

  if (pillarEntry?.brief) {
    briefLines.push(pillarEntry.brief)
  }

  if (pillarEntry?.tone) {
    briefLines.push(`Ton: ${pillarEntry.tone}`)
  }

  if (pillarEntry?.desiredFeeling) {
    briefLines.push(`Gewuenschtes Gefuehl bei der Leserin: ${pillarEntry.desiredFeeling}`)
  }

  if (scenarioEntry) {
    briefLines.push(`\nSzenario: ${scenario}`)
    if (scenarioEntry.description) briefLines.push(scenarioEntry.description)
  }

  // Caption brief
  const pillarCaptionRules = pillarEntry?.production?.captionRules
    ? `\nPILLAR-SPEZIFISCH: ${pillarEntry.production.captionRules}`
    : ''

  briefLines.push(`\nCaption: Eigenstaendiges Stueck Content, NICHT eine Zusammenfassung der Slides.
- Eigener Hook in den ersten 125 Zeichen (vor dem "mehr"-Umbruch)
- Caption-Hook NICHT identisch mit Slide-Hook
- Wert liefern auch ohne die Slides gesehen zu haben
- CTA am Ende (passend zum Pillar)
- ${defaults.captionMinChars}-${defaults.captionMaxChars} Zeichen
- Maximal 3-5 relevante Hashtags, oder gar keine.${pillarCaptionRules}`)

  sections.push(`# 4. BRIEF\n\n${briefLines.join('\n')}`)

  // =====================================================================
  // BLOCK 5: RULES
  // Hard constraints, anti-patterns, output format
  // Read fully before starting. If about to break a rule, stop.
  // =====================================================================
  const ruleLines: string[] = []
  ruleLines.push('Lies diese Regeln vollstaendig. Wenn Du dabei bist, eine zu brechen, stopp und korrigiere.')

  // Zone separation rule - must come first, most commonly violated
  ruleLines.push(`## ZONEN-TRENNUNG (haerteste Regel - Verstoss = sofort korrigieren)

Jeder Slide hat 3 Zonen: hook_text, body_text, cta_text. Diese Zonen werden GETRENNT gerendert. Text der in zwei Zonen steht, erscheint DOPPELT auf dem Slide.

VERBOTEN:
- hook_text und erster Satz von body_text sagen das Gleiche -> body_text muss NACH dem Hook-Gedanken einsetzen
- Letzter Satz von body_text und cta_text sagen das Gleiche -> body_text fuehrt zum CTA hin, wiederholt ihn aber NICHT
- Gleicher Satz in zwei Feldern -> Die Leserin sieht ihn zweimal auf dem Bildschirm

PRUEFE VOR DER AUSGABE: Lies hook_text und den ersten Satz von body_text laut vor. Klingen sie gleich? Dann aendere body_text. Lies den letzten Satz von body_text und cta_text laut vor. Klingen sie gleich? Dann aendere body_text.`)

  // Anti-patterns (global + scenario-specific)
  let antiPatternSection = antiPatterns
  if (scenarioEntry?.antiPatterns) {
    antiPatternSection += `\n\n### Szenario-spezifisch: ${scenario}\n${scenarioEntry.antiPatterns}`
  }
  ruleLines.push(antiPatternSection)

  // Character limits
  ruleLines.push(`## HARTE ZEICHENLIMITS (Ueberschreitung = Fehler)

Diese Limits sind technische Grenzen der App. Text der laenger ist wird abgeschnitten und zerstoert den Post. Zaehle die Zeichen BEVOR Du antwortest.

- Caption: EXAKT ${defaults.captionMinChars}-${defaults.captionMaxChars} Zeichen. Kuerze rigoros. Lieber 250 als 400.
- Body pro Slide: MAXIMAL ${defaults.bodyMaxChars} Zeichen. Das sind circa 3-4 kurze Saetze.
- Hook: MAXIMAL 80 Zeichen. Kuerzer ist besser.
- CTA-Text: MAXIMAL 120 Zeichen.

Faustregel: Wenn Du unsicher bist, schreib kuerzer.`)

  // Output format
  const baseGf = defaults.generationFields ?? { single: 'all', carouselCover: 'all', carouselContent: 'all', carouselCta: 'all' }
  const gf = {
    ...baseGf,
    ...(libraryHook && libraryCta ? { single: 'body_only' as const } : libraryHook ? { single: 'body_cta' as const } : libraryCta ? { single: 'hook_body' as const } : {}),
    ...(libraryHook ? { carouselCover: 'body_only' as const } : {}),
    ...(libraryCta ? { carouselCta: 'body_only' as const } : {}),
  }

  const formatSection = contentType === 'single'
    ? `GENAU 1 Slide.\n- slide_type: "cover"\n${describeFields(gf.single)}`
    : `GENAU ${carouselCount} Slides:\n- Slide 1 (cover): ${describeFieldsInline(gf.carouselCover)}\n- Slides 2-${carouselCount - 1} (content): ${describeFieldsInline(gf.carouselContent)}\n- Slide ${carouselCount} (cta): ${describeFieldsInline(gf.carouselCta)}`

  const fieldRule = contentType === 'single'
    ? buildFieldRule(gf.single)
    : buildCarouselFieldRules(gf)

  ruleLines.push(`## Output-Format

Sprache: Deutsch. Anrede "Du" (grossgeschrieben).
Antworte NUR mit validem JSON. Kein Markdown, keine Code-Bloecke.

${formatSection}

${contentType === 'single'
    ? `{"slides":[{"slide_type":"cover","hook_text":"...","body_text":"...","cta_text":"..."}],"caption":"..."}`
    : `{"slides":[{"slide_type":"cover","hook_text":"...","body_text":"...","cta_text":"..."},{"slide_type":"content","hook_text":"...","body_text":"...","cta_text":"..."},{"slide_type":"cta","hook_text":"...","body_text":"...","cta_text":"..."}],"caption":"..."}`}

- JEDER Slide hat IMMER alle 3 JSON-Felder (hook_text, body_text, cta_text) als Keys.
${fieldRule}
- ZONEN-TRENNUNG beachten (siehe oben). hook_text, body_text, cta_text werden getrennt gerendert. Kein Text darf in zwei Zonen stehen.
- slide_type "cover" fuer Slide 1
- ${contentType === 'carousel' ? 'slide_type "cta" fuer letzten Slide\n- slide_type "content" fuer alle mittleren Slides' : 'Alle Felder muessen als Keys vorhanden sein'}`)

  sections.push(`# 5. RULES\n\n${ruleLines.join('\n\n')}`)

  // Token budget check
  let prompt = sections.join('\n\n---\n\n')
  if (prompt.length > 32000) {
    prompt = prompt.slice(0, 32000) + '\n\n[Context truncated due to length]'
  }

  return prompt
}

/** Build pillar-specific CTA calibration section */
function buildCtaSection(pillar: string, slideCount: number): string {
  const pillarLower = pillar.toLowerCase()

  if (pillarLower.includes('generate')) {
    return `## CTA-Kalibrierung: ${pillar}

PRODUKTREGEL: KEIN Produktbezug. Null. Nicht mal subtil. Kein Journal, kein Buch, kein Shop, kein "Link in Bio". Das Produkt existiert in diesem Post NICHT.
Soft CTA: "Speicher Dir das fuer spaeter" / "Folge fuer mehr" / "Tagge eine Freundin, die das braucht"
Ziel: Reichweite, Saves, Shares. Wert liefern, nichts verkaufen.`
  }

  if (pillarLower.includes('convert')) {
    return `## CTA-Kalibrierung: ${pillar}

PRODUKTREGEL: Dieser Post fuehrt KLAR zum Produkt hin. Das Journal ist das Ziel dieses Posts.
Produkt erwaehnen, aber als selbstverstaendlichen Teil von Jules Leben, nicht als Pitch.
Das Produkt gehoert zu Jules Abend wie der Nachttisch zum Schlafzimmer. Nicht anbieten, sondern zeigen dass es da ist.
Formulierung: "Mein LEBEN.LIEBEN Journal liegt auf meinem Nachttisch." / "Ich greife nach meinem Journal."
Produkt fruehestens auf Slide ${Math.max(slideCount - 2, 4)} bei Carousel, nie auf Slide 1-3.
CTA: Nimm an, dass die Leserin es will. Frage WANN, nicht OB. "Wann legst Du Dir deins auf deinen Nachttisch?" statt "Link in Bio, falls das etwas fuer Dich sein koennte."
NICHT: hedging CTAs wie "falls", "wenn Du magst", "koennte". Die Leserin ist hier, weil sie sich angesprochen fuehlt.`
  }

  // Nurture Loyalty
  return `## CTA-Kalibrierung: ${pillar}

PRODUKTREGEL: Kein aktiver Verkauf. Produktentwicklung und Entstehungsgeschichte zeigen ist OK (Behind-the-Scenes). Kein Produktnutzen, keine Kaufaufforderung.
Spreche zu Menschen, die sich mit der Marke verbunden fuehlen.
Engagement-CTA: "Wie macht ihr das?" / "Schreib mir, ich bin neugierig"
Community staerken, nicht verkaufen.`
}

type FieldMode = 'all' | 'hook_body' | 'body_cta' | 'body_only' | 'hook_only'

const FIELD_LABELS: Record<FieldMode, string[]> = {
  all: ['hook_text', 'body_text', 'cta_text'],
  hook_body: ['hook_text', 'body_text'],
  body_cta: ['body_text', 'cta_text'],
  body_only: ['body_text'],
  hook_only: ['hook_text'],
}

function activeFields(mode: FieldMode): string[] {
  return FIELD_LABELS[mode] ?? FIELD_LABELS.all
}

function emptyFields(mode: FieldMode): string[] {
  const active = new Set(activeFields(mode))
  return ['hook_text', 'body_text', 'cta_text'].filter(f => !active.has(f))
}

function describeFields(mode: FieldMode): string {
  const lines: string[] = []
  const active = new Set(activeFields(mode))
  if (active.has('hook_text')) lines.push('- hook_text: Der Hook (oben auf dem Slide)')
  if (active.has('body_text')) lines.push('- body_text: Der Haupttext (Mitte)')
  if (active.has('cta_text')) lines.push('- cta_text: CTA (unten)')
  const empty = emptyFields(mode)
  if (empty.length > 0) lines.push(`- ${empty.join(', ')}: Leerer String ""`)
  return lines.join('\n')
}

function describeFieldsInline(mode: FieldMode): string {
  const active = activeFields(mode)
  const empty = emptyFields(mode)
  let desc = active.join(' + ') + ' befuellen'
  if (empty.length > 0) desc += `. ${empty.join(', ')} = ""`
  return desc
}

function buildFieldRule(mode: FieldMode): string {
  if (mode === 'all') return '- Alle 3 Felder (hook_text, body_text, cta_text) mit Inhalt befuellen. KEIN Feld leer.'
  const active = activeFields(mode)
  const empty = emptyFields(mode)
  return `- Nur ${active.join(' und ')} mit Inhalt befuellen.\n- ${empty.join(' und ')} MUSS ein leerer String "" sein.`
}

function buildCarouselFieldRules(gf: { carouselCover: string; carouselContent: string; carouselCta: string }): string {
  const lines: string[] = []
  const modes = [
    ['Cover (Slide 1)', gf.carouselCover as FieldMode],
    ['Content (mittlere Slides)', gf.carouselContent as FieldMode],
    ['CTA (letzter Slide)', gf.carouselCta as FieldMode],
  ] as const
  for (const [label, mode] of modes) {
    const active = activeFields(mode)
    const empty = emptyFields(mode)
    if (mode === 'all') {
      lines.push(`- ${label}: Alle 3 Felder mit Inhalt befuellen.`)
    } else {
      lines.push(`- ${label}: Nur ${active.join(' + ')} befuellen.${empty.length > 0 ? ` ${empty.join(' + ')} = ""` : ''}`)
    }
  }
  return lines.join('\n')
}
