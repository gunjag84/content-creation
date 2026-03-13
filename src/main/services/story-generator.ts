import type { Settings } from '../../shared/types/settings'
import type { Slide } from '../../shared/types/generation'

export interface FeedPostContext {
  slides: Slide[]
  caption: string
  pillar: string
  theme: string
  mechanic: string
}

/**
 * Builds the Claude API prompt for story generation
 */
export function buildStoryPrompt(feedPost: FeedPostContext, settings: Settings): string {
  // Extract slide texts for context
  const slideTexts = feedPost.slides
    .map((slide, idx) => {
      return `Slide ${idx + 1} (${slide.slide_type}):
Hook: ${slide.hook_text}
Body: ${slide.body_text}
CTA: ${slide.cta_text}`
    })
    .join('\n\n')

  // Build story tools catalog from active tools
  const activeTools = settings.storyTools?.tools.filter((t) => t.active) || []
  const toolsCatalog = activeTools
    .map((tool) => {
      return `- ${tool.name}: ${tool.description}
  Engagement: ${tool.engagementType || 'N/A'}
  Best for mechanics: ${tool.mechanicRecommendations?.join(', ') || 'Any'}`
    })
    .join('\n')

  // Build the prompt
  const prompt = `You are a social media strategist creating Instagram story proposals to support a feed post.

## Feed Post Context

**Pillar:** ${feedPost.pillar}
**Theme:** ${feedPost.theme}
**Mechanic:** ${feedPost.mechanic}

**Caption:**
${feedPost.caption}

**Slides:**
${slideTexts}

## Story Types to Generate

Generate 2-4 story proposals using these types:

1. **Teaser** - Posted BEFORE the feed post to build anticipation
   - Timing: before
   - Purpose: Drive followers to check feed later
   - Tools: countdown, poll, question

2. **Reference** - Posted AFTER the feed post to drive engagement
   - Timing: after
   - Purpose: Send followers to the post ("Swipe up to see full post")
   - Tools: poll, quiz, link sticker

3. **Deepening** - Posted AFTER to expand on post content
   - Timing: after
   - Purpose: Dive deeper into a specific slide or concept
   - Tools: quiz, question, poll

4. **Behind the Scenes** - Posted AFTER to add personality
   - Timing: after
   - Purpose: Show the creation process or personal context
   - Tools: question, poll, text-only

## Available Story Tools

${toolsCatalog}

## Output Format

Return ONLY valid JSON (no markdown, no explanation) in this format:

[
  {
    "story_type": "teaser" | "reference" | "deepening" | "behind_the_scenes",
    "tool_type": "poll" | "quiz" | "question" | "countdown" | "link" | etc.,
    "tool_content": "JSON string with poll question/options, quiz Q&A, etc.",
    "timing": "before" | "after",
    "source_slide_index": 0,
    "text_content": "Story text that appears on screen",
    "rationale": "Why this story supports the feed post"
  }
]

## Rules

- Generate 2-4 stories (variety of types)
- Match tool_type to story_type appropriately
- For teaser stories: timing must be "before"
- For reference/deepening/BTS: timing must be "after"
- tool_content should be a JSON string (e.g., "{\"question\": \"What's your biggest challenge?\", \"options\": [\"Time\", \"Money\", \"Focus\"]}")
- source_slide_index: which slide this story references (0-indexed)
- text_content: the actual text that goes on the story image (short, punchy)
- Return ONLY the JSON array, no extra text

Generate the stories now.`

  return prompt
}
