import type { Settings } from '@shared/types/settings'
import type { GenerationResult, StoryProposal } from '@shared/types/generation'

/**
 * Assembles the master prompt for feed post generation.
 *
 * Includes:
 * - Brand voice (always)
 * - Target persona (always)
 * - Content pillar and theme (always)
 * - Mechanic rules (when mechanic is active)
 * - Content defaults (always)
 * - Competitor analysis (optional - skip when empty)
 * - Viral expertise (optional - skip when empty)
 * - Impulse (optional - appended as "Additional Guidance")
 * - Master prompt template (always, at the end)
 *
 * Estimates token count (chars/4) and truncates optional sections if > 8000 tokens.
 *
 * @param pillar Selected content pillar
 * @param theme Selected theme
 * @param mechanic Selected mechanic
 * @param impulse Optional impulse text for additional guidance
 * @param settings Full settings object
 * @returns Assembled prompt string
 */
export function assembleMasterPrompt(
  pillar: string,
  theme: string,
  mechanic: string,
  impulse: string,
  settings: Settings,
  contentType: 'single' | 'carousel' = 'carousel'
): string {
  const sections: string[] = []

  // 1. Brand Voice (required)
  if (settings.brandVoice) {
    const brandSection: string[] = ['## Brand Voice']

    if (settings.brandVoice.tonality) {
      brandSection.push(`**Tonality:** ${settings.brandVoice.tonality}`)
    }

    if (settings.brandVoice.dos && settings.brandVoice.dos.length > 0) {
      brandSection.push(`\n**Do:**`)
      settings.brandVoice.dos.forEach(item => brandSection.push(`- ${item}`))
    }

    if (settings.brandVoice.donts && settings.brandVoice.donts.length > 0) {
      brandSection.push(`\n**Don't:**`)
      settings.brandVoice.donts.forEach(item => brandSection.push(`- ${item}`))
    }

    if (settings.brandVoice.voiceProfile) {
      brandSection.push(`\n**Voice Profile:** ${settings.brandVoice.voiceProfile}`)
    }

    sections.push(brandSection.join('\n'))
  }

  // 2. Target Persona (required)
  if (settings.targetPersona) {
    const personaSection: string[] = ['## Target Persona']

    if (settings.targetPersona.name) {
      personaSection.push(`**Name:** ${settings.targetPersona.name}`)
    }

    if (settings.targetPersona.demographics) {
      personaSection.push(`**Demographics:** ${settings.targetPersona.demographics}`)
    }

    if (settings.targetPersona.painPoints && settings.targetPersona.painPoints.length > 0) {
      personaSection.push(`\n**Pain Points:**`)
      settings.targetPersona.painPoints.forEach(point => personaSection.push(`- ${point}`))
    }

    if (settings.targetPersona.goals && settings.targetPersona.goals.length > 0) {
      personaSection.push(`\n**Goals:**`)
      settings.targetPersona.goals.forEach(goal => personaSection.push(`- ${goal}`))
    }

    sections.push(personaSection.join('\n'))
  }

  // 3. Content Pillar and Theme (required)
  sections.push(`## Content Focus\n**Pillar:** ${pillar}\n**Theme:** ${theme}`)

  // 4. Mechanic Rules (conditional - only if mechanic is active)
  if (settings.mechanics?.mechanics) {
    const mechanicConfig = settings.mechanics.mechanics.find(
      m => m.name === mechanic && m.active
    )

    if (mechanicConfig) {
      const mechanicSection: string[] = [`## Post Mechanic: ${mechanicConfig.name}`]

      if (mechanicConfig.description) {
        mechanicSection.push(mechanicConfig.description)
      }

      if (mechanicConfig.hookRules) {
        mechanicSection.push(`\n**Hook Rules:** ${mechanicConfig.hookRules}`)
      }

      if (mechanicConfig.structureGuidelines) {
        mechanicSection.push(`\n**Structure:** ${mechanicConfig.structureGuidelines}`)
      }

      if (mechanicConfig.slideRange) {
        mechanicSection.push(
          `\n**Slide Range:** ${mechanicConfig.slideRange.min}-${mechanicConfig.slideRange.max} slides`
        )
      }

      sections.push(mechanicSection.join('\n'))
    }
  }

  // 5. Content Defaults (required)
  const defaultsSection = [
    '## Content Constraints',
    `**Carousel Slides:** ${settings.contentDefaults.carouselSlideMin}-${settings.contentDefaults.carouselSlideMax}`,
    `**Caption Max:** ${settings.contentDefaults.captionMaxChars} characters`,
    `**Hashtags:** ${settings.contentDefaults.hashtagMin}-${settings.contentDefaults.hashtagMax}`
  ]
  sections.push(defaultsSection.join('\n'))

  // 6. Competitor Analysis (optional - skip if empty)
  let competitorSection = ''
  if (settings.competitorAnalysis?.text && settings.competitorAnalysis.text.trim() !== '') {
    competitorSection = `## Competitor Analysis\n${settings.competitorAnalysis.text}`
  }

  // 7. Viral Expertise (optional - skip if empty)
  let viralSection = ''
  if (settings.viralExpertise?.text && settings.viralExpertise.text.trim() !== '') {
    viralSection = `## Viral Patterns\n${settings.viralExpertise.text}`
  }

  // 8. Impulse (optional - appended as Additional Guidance)
  let impulseSection = ''
  if (impulse && impulse.trim() !== '') {
    impulseSection = `## Additional Guidance\n${impulse}`
  }

  // Assemble initial prompt with required sections
  let prompt = sections.join('\n\n')

  // Try to add optional sections, checking token count
  const estimateTokens = (text: string) => Math.ceil(text.length / 4)

  // Calculate space for master template and impulse (always included)
  const masterTemplate = settings.masterPrompt?.template || ''
  const reservedSpace = masterTemplate.length + (impulseSection ? impulseSection.length + 4 : 0) // +4 for \n\n separators
  const TOKEN_LIMIT = 8000

  // Add competitor if space allows (after accounting for reserved sections and viral)
  if (competitorSection) {
    const viralSpace = viralSection ? viralSection.length + 2 : 0
    const testPrompt = prompt + '\n\n' + competitorSection
    const totalEstimate = estimateTokens(testPrompt) + Math.ceil((reservedSpace + viralSpace) / 4)
    if (totalEstimate < TOKEN_LIMIT) {
      prompt = testPrompt
    }
  }

  // Add viral if space allows (after accounting for reserved sections)
  if (viralSection) {
    const testPrompt = prompt + '\n\n' + viralSection
    const totalEstimate = estimateTokens(testPrompt) + Math.ceil(reservedSpace / 4)
    if (totalEstimate < TOKEN_LIMIT) {
      prompt = testPrompt
    }
  }

  // Add impulse if provided (higher priority than competitor/viral)
  if (impulseSection) {
    prompt = prompt + '\n\n' + impulseSection
  }

  // 9. Master Prompt Template (required - always at the end)
  // Replace known template variables before appending
  if (masterTemplate) {
    // Derive mechanic guidelines for {{mechanic_guidelines}} variable
    const mechanicConfig = settings.mechanics?.mechanics?.find(
      m => m.name === mechanic && m.active
    )
    const mechanicGuidelines = [
      mechanicConfig?.hookRules,
      mechanicConfig?.structureGuidelines
    ].filter(Boolean).join('. ')

    let processedTemplate = masterTemplate
      // Content variables - replace with actual values
      .replace(/\{\{pillar\}\}/g, pillar)
      .replace(/\{\{oberthema\}\}/g, theme)
      .replace(/\{\{content_type\}\}/g, contentType)
      .replace(/\{\{mechanic_name\}\}/g, mechanic)
      .replace(/\{\{mechanic_guidelines\}\}/g, mechanicGuidelines)
      // Sections already assembled above - remove placeholders to avoid duplication
      .replace(/\{\{brand_voice\}\}/g, '')
      .replace(/\{\{target_persona\}\}/g, '')
      .replace(/\{\{competitor_analysis\}\}/g, '')
      .replace(/\{\{viral_expertise\}\}/g, '')
      .replace(/\{\{learning_context\}\}/g, '')
      // Remove any remaining unknown placeholders
      .replace(/\{\{[^}]+\}\}/g, '')

    prompt = prompt + '\n\n' + processedTemplate
  }

  // 10. JSON output instruction (always last - overrides any markdown format in template)
  prompt += '\n\n[REQUIRED OUTPUT FORMAT]\nReturn ONLY a valid JSON object. No text before or after the JSON. No markdown code blocks.\n' +
    '{"slides":[{"slide_number":1,"slide_type":"cover","hook_text":"...","body_text":"...","cta_text":""},{"slide_number":2,"slide_type":"content","hook_text":"","body_text":"...","cta_text":""},{"slide_number":3,"slide_type":"cta","hook_text":"","body_text":"...","cta_text":"..."}],"caption":"..."}\n' +
    'Rules: slide_type must be "cover" for slide 1, "cta" for the last slide, "content" for all others. overlay_opacity defaults to 0.5.'

  return prompt
}

/**
 * Assembles a story-specific prompt for Claude.
 *
 * Includes:
 * - Feed post context (slides and caption from generation)
 * - Story proposal details (type, tool, timing, source slide)
 * - Request for final story text and tool content
 *
 * @param pillar Content pillar
 * @param theme Theme
 * @param generationResult The feed post generation result
 * @param storyProposal The story proposal to generate content for
 * @param settings Full settings object
 * @returns Assembled story prompt
 */
export function assembleStoryPrompt(
  pillar: string,
  theme: string,
  generationResult: GenerationResult,
  storyProposal: StoryProposal,
  settings: Settings
): string {
  const sections: string[] = []

  // 1. Context from feed post
  sections.push('## Feed Post Context')
  sections.push(`**Pillar:** ${pillar}`)
  sections.push(`**Theme:** ${theme}`)
  sections.push('\n**Slides:**')

  generationResult.slides.forEach((slide, idx) => {
    sections.push(`\nSlide ${idx + 1} (${slide.slide_type}):`)
    if (slide.hook_text) sections.push(`Hook: ${slide.hook_text}`)
    if (slide.body_text) sections.push(`Body: ${slide.body_text}`)
    if (slide.cta_text) sections.push(`CTA: ${slide.cta_text}`)
  })

  sections.push(`\n**Caption:**\n${generationResult.caption}`)

  // 2. Story proposal details
  sections.push('\n## Story to Generate')
  sections.push(`**Type:** ${storyProposal.story_type}`)
  sections.push(`**Tool:** ${storyProposal.tool_type}`)
  sections.push(`**Timing:** ${storyProposal.timing} the feed post`)

  if (storyProposal.tool_content) {
    sections.push(`\n**Tool Content (proposed):**\n${storyProposal.tool_content}`)
  }

  if (storyProposal.text_content) {
    sections.push(`\n**Text Content (proposed):**\n${storyProposal.text_content}`)
  }

  sections.push(`\n**Rationale:** ${storyProposal.rationale}`)

  // 3. Request
  sections.push('\n## Task')
  sections.push('Generate the final story content based on the above context and proposal.')
  sections.push('Return JSON with:')
  sections.push('- text_content: The text to display on the story image')
  sections.push('- tool_content: JSON string with the interactive tool configuration')

  // Add brand voice if available
  if (settings.brandVoice?.tonality) {
    sections.push(`\n**Brand Tonality:** ${settings.brandVoice.tonality}`)
  }

  return sections.join('\n')
}
