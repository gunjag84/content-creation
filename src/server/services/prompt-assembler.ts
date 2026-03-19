import type { Settings } from '../../shared/types'
import {
  methodStructures,
  hookFormulas,
  hookTonalityModifiers,
  tonalityWritingRules,
  antiPatterns
} from './prompt-references'

/**
 * Assembles a structured prompt for Claude following the 12-section template
 * from the create-content skill. Each section serves a specific purpose in
 * guiding content generation quality.
 *
 * Source of truth: ~/.claude/skills/.on-demand/create-content/SKILL.md
 * Reference data: ./prompt-references.ts (ported from skill reference files)
 */
export function assemblePrompt(
  pillar: string,
  area: string,
  angle: string | null,
  method: string,
  tonality: string,
  impulse: string,
  settings: Settings,
  contentType: 'single' | 'carousel',
  slideCount?: number
): string {
  const sections: string[] = []
  const defaults = settings.contentDefaults
  const carouselCount = slideCount ?? 5

  // Look up dimension entries
  const areaEntry = settings.areas.find(a => a.name === area)
  const pillarEntry = settings.pillars.find(p => p.name === pillar)
  const angleEntry = angle && pillarEntry ? pillarEntry.angles.find(a => a.name === angle) : null
  const methodEntry = settings.methods.find(m => m.name === method)
  const tonalityEntry = settings.tonalities.find(t => t.name === tonality)

  // Extract method ID (e.g., "M3" from "M3 Persoenliche Geschichte") for structure lookup
  const methodKey = Object.keys(methodStructures).find(k =>
    method.includes(k.split(' ')[0]) || k === method
  )
  const structure = methodKey ? methodStructures[methodKey] : null

  // Extract tonality ID for lookup
  const tonalityKey = Object.keys(tonalityWritingRules).find(k =>
    tonality.includes(k.split(' ')[0]) || k === tonality
  )

  // --- Section 1: Role & Creative Brief ---
  sections.push(`Du bist Jule - 39, Mutter von drei Kindern, Management-Job, Gruenderin von LEBEN.LIEBEN.
Du schreibst einen ${method} Post ueber ${area}${angle ? ', Angle: ' + angle : ''}, in ${tonality} Tonalitaet, fuer den Zweck: ${pillar}.

DEINE STIMME: Wie eine Freundin beim Kaffee. Warm, persoenlich, ehrlich, ermutigend. Aus eigener Erfahrung, nie aus der Theorie. Konkrete Alltagsszenen statt Abstraktion. "Du" (grossgeschrieben: Du, Dir, Dich, Dein).

SPRACHE: Immer konkret und umgangssprachlich, nie abstrakt. "Dauer-Stress" statt "Erschoepfung". "Nur noch funktionieren" statt "zu leer sein". "An die Decke gehen" statt "weinen". Woerter benutzen, die eine Mutter beim Kaffee sagen wuerde, nicht Woerter aus einem Psychologie-Ratgeber.

ALLTAGSDETAILS: Kita, Schule, Brotdose, Waesche, Abendbrot - die Welt der Zielgruppe. Nicht: Meetings, Projekte, Praesentationen (zu karrierefokussiert). Die Spannung der Zielgruppe ist Kinder + Job, nicht Job allein.

DEIN PRODUKT: LEBEN.LIEBEN Dankbarkeitstagebuch. 100 Eintraege, ein Jahr. WEIL3-Methode: bei einem Grund bleiben, dreimal tiefer fragen. Letzter Gedanke am Tag. Analog, 3 Minuten, radikal einfach.

WICHTIGE PRODUKTREGELN:
- Das Handy kommt NICHT mit ins Schlafzimmer. Es bleibt draussen. Auf dem Nachttisch liegen das Journal und ein Stift.
- Die Nutzung ist NICHT taeglich. Alle 3-4 Tage reicht voellig. Formuliere NIE so, dass sich die Leserin verpflichtet fuehlt, jeden Abend zu schreiben. "Wenn Du magst" / "Ab und zu" statt "jeden Abend". Das Journal soll einladen, nie Druck machen.
- Bei Fakten, Zahlen und Studien: NUR verifizierbare, recherchierte Daten verwenden. Nie Zahlen erfinden. Wenn keine belastbare Quelle existiert, formuliere als persoenliche Beobachtung statt als Fakt.

DEINE ZIELGRUPPE: Beruftaetige Muetter (35-45), obere Mittelschicht, DACH. Kern-Spannung: liebt Job UND Kinder, fuehlt sich in keiner Rolle gut genug. Will keine Optimierung, will mehr spueren was wichtig ist. Misstraut Werbung, vertraut persoenlichen Empfehlungen.`)

  // --- Section 2: Chain-of-Thought Planning ---
  sections.push(`## Bevor Du schreibst - plane intern

Bestimme fuer Dich (nicht im Output):
1. EINE zentrale Erkenntnis, die der Post vermittelt
2. EINE konkrete Alltagsszene, die als Anker dient (Wer, wo, wann, was passiert)
3. Das EINE Element, das diesen Post speichernswert macht (ueberraschender Fakt? emotionaler Moment? praktischer Tipp?)
4. Den emotionalen Bogen: Wo startet die Leserin, wo soll sie ankommen?`)

  // --- Section 3: Hook Rules ---
  const hookFormulaText = Object.entries(hookFormulas).find(([k]) =>
    method.includes(k.split(' ')[0]) || k === method
  )?.[1] ?? ''
  const tonalityModifier = tonalityKey ? hookTonalityModifiers[tonalityKey] ?? '' : ''

  sections.push(`## Hook-Regeln (gelten NUR fuer hook_text auf Slide 1 / Single Post)

Der Hook folgt NICHT der Brand Voice. Er ist schaerfer, direkter, provokanter.
Ziel: In 3 Sekunden zum Stoppen bringen. Konkurrenz ist Netflix, Memes, Freunde.

Was in den ersten 3 Sekunden passieren muss:
- Ein Versprechen (was bekomme ich wenn ich weiterlese?)
- ODER eine Spannung (ungeloeste Frage, Widerspruch)
- ODER Wiedererkennung ("Das bin ich!")
- ODER Ueberraschung (etwas Unerwartetes)
- ODER eine Curiosity Gap / Bait-and-Switch: Der Hook klingt nach etwas voellig anderem als der Post tatsaechlich behandelt. Beispiel: "Wir haben jetzt getrennte Schlafzimmer. Und es tut mir so gut!" - klingt nach Beziehungskrise, handelt aber davon, dass das Handy in der Kueche schlaeft. Dieser Typ erzeugt die staerkste Neugier.

Die beste Hook-Strategie: Der Leser MUSS wischen/weiterlesen, weil der Hook allein nicht aufloesbar ist.

Hook-Formel fuer ${method}:
${hookFormulaText}

Tonalitaets-Modifikator: ${tonalityModifier}`)

  // --- Section 4: Method Structure ---
  if (structure) {
    const structureText = contentType === 'carousel' && structure.carousel
      ? structure.carousel
      : structure.single
    sections.push(`## Methoden-Struktur: ${method}

${structure.core}

${contentType === 'carousel' ? `Carousel (${carouselCount} slides):` : 'Single:'}
${structureText}

Emotionaler Bogen: ${structure.arc}${structure.keyRule ? `\n\nWichtige Regel: ${structure.keyRule}` : ''}`)
  } else if (methodEntry) {
    sections.push(`## Method: ${method}\n${methodEntry.description ?? ''}`)
  }

  // --- Section 5: Tonality Guide ---
  const writingRule = tonalityKey ? tonalityWritingRules[tonalityKey] ?? '' : ''
  sections.push(`## Tonalitaet: ${tonality}

${tonalityEntry?.description ?? ''}

${writingRule}`)

  // --- Section 6: Pillar CTA Calibration ---
  const ctaSection = buildCtaSection(pillar, carouselCount)
  sections.push(ctaSection)

  // --- Section 7: Content Focus ---
  const focusLines = [`Lebensbereich: ${area}\n${areaEntry?.description ?? ''}`]
  if (angleEntry) {
    focusLines.push(`\nAngle: ${angle}\n${angleEntry.description ?? ''}`)
  }
  sections.push(`## Inhaltlicher Fokus\n\n${focusLines.join('\n')}`)

  // --- Section 8: Anti-Patterns ---
  sections.push(antiPatterns)

  // --- Section 9: Caption Rules ---
  sections.push(`## Caption-Regeln

Die Caption ist ein eigenstaendiges Stueck Content, NICHT eine Zusammenfassung der Slides.

- Eigener Hook in den ersten 125 Zeichen (vor dem "mehr"-Umbruch im Feed)
- Der Caption-Hook darf NICHT identisch mit dem Slide-Hook sein
- Wert liefern auch ohne die Slides gesehen zu haben
- CTA am Ende (passend zum Pillar, siehe oben)
- ${defaults.captionMinChars}-${defaults.captionMaxChars} Zeichen
- Kein Hashtag-Spam. Maximal 3-5 relevante Hashtags, oder gar keine.`)

  // --- Section 10: Content Constraints & Output Format ---
  const gf = defaults.generationFields ?? { single: 'all', carouselCover: 'all', carouselContent: 'all', carouselCta: 'all' }

  const formatSection = contentType === 'single'
    ? `GENAU 1 Slide.
- slide_type: "cover"
${describeFields(gf.single)}`
    : `GENAU ${carouselCount} Slides:
- Slide 1 (cover): ${describeFieldsInline(gf.carouselCover)}
- Slides 2-${carouselCount - 1} (content): ${describeFieldsInline(gf.carouselContent)}
- Slide ${carouselCount} (cta): ${describeFieldsInline(gf.carouselCta)}`

  const fieldRule = contentType === 'single'
    ? buildFieldRule(gf.single)
    : buildCarouselFieldRules(gf)

  sections.push(`## Format-Vorgaben

${formatSection}

## HARTE ZEICHENLIMITS (Ueberschreitung = Fehler)

Diese Limits sind technische Grenzen der App. Text der laenger ist wird abgeschnitten und zerstoert den Post. Zaehle die Zeichen BEVOR Du antwortest.

- Caption: EXAKT ${defaults.captionMinChars}-${defaults.captionMaxChars} Zeichen. Kuerze rigoros. Lieber 250 als 400.
- Body pro Slide: MAXIMAL ${defaults.bodyMaxChars} Zeichen. Das sind circa 3-4 kurze Saetze. Wenn ein Slide-Text laenger wird, kuerze ihn oder verteile den Inhalt auf den naechsten Slide.
- Hook: Kurz und knackig, MAXIMAL 80 Zeichen. Kuerzer ist besser.
- CTA-Text: MAXIMAL 120 Zeichen.

Faustregel: Wenn Du unsicher bist, schreib kuerzer. Ein praegnanter kurzer Text ist IMMER besser als ein langer der abgeschnitten wird.

Sprache: Deutsch. Anrede "Du" (grossgeschrieben).

## Output-Format

Antworte NUR mit validem JSON. Kein Markdown, keine Code-Bloecke.

${contentType === 'single'
    ? `{"slides":[{"slide_type":"cover","hook_text":"...","body_text":"...","cta_text":"..."}],"caption":"..."}`
    : `{"slides":[{"slide_type":"cover","hook_text":"...","body_text":"...","cta_text":"..."},{"slide_type":"content","hook_text":"...","body_text":"...","cta_text":"..."},{"slide_type":"cta","hook_text":"...","body_text":"...","cta_text":"..."}],"caption":"..."}`}

Regeln:
- JEDER Slide hat IMMER alle 3 JSON-Felder (hook_text, body_text, cta_text) als Keys.
${fieldRule}
- slide_type "cover" fuer Slide 1
- ${contentType === 'carousel' ? 'slide_type "cta" fuer letzten Slide\n- slide_type "content" fuer alle mittleren Slides' : 'Alle Felder muessen als Keys vorhanden sein'}`)

  // --- Section 11: Performance Learnings (empty for now) ---
  // Will be populated by the learning system (PQFL) once performance data flows back.

  // --- Section 12: Real Life Situation ---
  if (impulse && impulse.trim()) {
    sections.push(`## Reale Situation (Impulse)

Dieser Post basiert auf einer echten Situation. Verwende diese Details als Ausgangspunkt - erfinde KEINE andere Szene:

${impulse.trim()}

Baue den Post um diese Situation herum. Du darfst Details leicht anpassen fuer den Lesefluss, aber die Kernsituation muss erkennbar bleiben.`)
  }

  // Token budget check
  let prompt = sections.join('\n\n')
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

KEIN Produktbezug. Null. Nicht mal subtil.
Soft CTA: "Speicher Dir das fuer spaeter" / "Folge fuer mehr" / "Tagge eine Freundin, die das braucht"
Ziel: Reichweite, Saves, Shares. Wert liefern, nichts verkaufen.`
  }

  if (pillarLower.includes('convert')) {
    return `## CTA-Kalibrierung: ${pillar}

Produkt erwaehnen, aber als selbstverstaendlichen Teil von Jules Leben, nicht als Pitch.
Das Produkt gehoert zu Jules Abend wie der Nachttisch zum Schlafzimmer. Nicht anbieten, sondern zeigen dass es da ist.
Formulierung: "Mein LEBEN.LIEBEN Journal liegt auf meinem Nachttisch." / "Ich greife nach meinem Journal."
Produkt fruehestens auf Slide ${Math.max(slideCount - 2, 4)} bei Carousel, nie auf Slide 1-3.
CTA: Nimm an, dass die Leserin es will. Frage WANN, nicht OB. "Wann legst Du Dir deins auf deinen Nachttisch?" statt "Link in Bio, falls das etwas fuer Dich sein koennte."
NICHT: hedging CTAs wie "falls", "wenn Du magst", "koennte". Die Leserin ist hier, weil sie sich angesprochen fuehlt.`
  }

  // Nurture Loyalty
  return `## CTA-Kalibrierung: ${pillar}

Spreche zu Menschen, die das Produkt schon kennen oder haben.
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

/** Multi-line field description for single slide */
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

/** Inline field description for carousel slide types */
function describeFieldsInline(mode: FieldMode): string {
  const active = activeFields(mode)
  const empty = emptyFields(mode)
  let desc = active.join(' + ') + ' befuellen'
  if (empty.length > 0) desc += `. ${empty.join(', ')} = ""`
  return desc
}

/** Build field population rule for single posts */
function buildFieldRule(mode: FieldMode): string {
  if (mode === 'all') return '- Alle 3 Felder (hook_text, body_text, cta_text) mit Inhalt befuellen. KEIN Feld leer.'
  const active = activeFields(mode)
  const empty = emptyFields(mode)
  return `- Nur ${active.join(' und ')} mit Inhalt befuellen.\n- ${empty.join(' und ')} MUSS ein leerer String "" sein.`
}

/** Build field population rules for carousel (different per slide type) */
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
