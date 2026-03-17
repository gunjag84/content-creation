import type { Settings } from '../../shared/types'

/**
 * Assembles a prompt for Claude from the hybrid settings schema.
 * Context docs are raw text blobs - included with headers when non-empty.
 * Structured data (pillar, theme, mechanic) injected as content focus.
 */
export function assemblePrompt(
  pillar: string,
  theme: string,
  mechanic: string,
  impulse: string,
  settings: Settings,
  contentType: 'single' | 'carousel'
): string {
  const sections: string[] = []

  // Context docs - each non-empty doc gets a header
  const docHeaders: Record<string, string> = {
    brandVoice: 'Brand Voice',
    targetPersona: 'Target Persona',
    productUVP: 'Product & UVP',
    competitive: 'Competitive Landscape',
    contentStrategy: 'Content Strategy',
    pov: 'Point of View'
  }

  for (const [key, header] of Object.entries(docHeaders)) {
    const text = settings.contextDocs[key as keyof typeof settings.contextDocs]
    if (text && text.trim()) {
      sections.push(`## ${header}\n${text.trim()}`)
    }
  }

  // Content focus
  sections.push(`## Content Focus\n**Pillar:** ${pillar}\n**Theme:** ${theme}`)

  // Mechanic details
  const mech = settings.mechanics.find(m => m.name === mechanic)
  if (mech) {
    const mechSection = [`## Post Mechanic: ${mech.name}`]
    if (mech.description) mechSection.push(mech.description)
    if (mech.slideRange) mechSection.push(`**Slide Range:** ${mech.slideRange.min}-${mech.slideRange.max} slides`)
    sections.push(mechSection.join('\n'))
  }

  // Content constraints
  const slideConstraint = contentType === 'single'
    ? '**Slides:** 1 (SINGLE POST - exactly ONE slide)'
    : `**Carousel Slides:** ${mech?.slideRange?.min ?? 3}-${mech?.slideRange?.max ?? 10}`
  sections.push(`## Content Constraints\n${slideConstraint}`)

  // Impulse
  if (impulse && impulse.trim()) {
    sections.push(`## Additional Guidance\n${impulse.trim()}`)
  }

  // Token budget check - truncate if over 8000 tokens (~32000 chars)
  let prompt = sections.join('\n\n')
  if (prompt.length > 32000) {
    prompt = prompt.slice(0, 32000) + '\n\n[Context truncated due to length]'
  }

  // JSON output instruction
  if (contentType === 'single') {
    prompt += '\n\n[REQUIRED OUTPUT FORMAT]\nReturn ONLY a valid JSON object. No markdown code blocks.\n' +
      '{"slides":[{"slide_type":"cover","hook_text":"...","body_text":"...","cta_text":"..."}],"caption":"..."}\n' +
      'Rules: EXACTLY 1 slide. slide_type must be "cover".'
  } else {
    prompt += '\n\n[REQUIRED OUTPUT FORMAT]\nReturn ONLY a valid JSON object. No markdown code blocks.\n' +
      '{"slides":[{"slide_type":"cover","hook_text":"...","body_text":"...","cta_text":""},{"slide_type":"content","hook_text":"","body_text":"...","cta_text":""},{"slide_type":"cta","hook_text":"","body_text":"...","cta_text":"..."}],"caption":"..."}\n' +
      'Rules: slide_type "cover" for first, "cta" for last, "content" for middle slides.'
  }

  return prompt
}
