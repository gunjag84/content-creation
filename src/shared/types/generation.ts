// Slide content for wizard state and DB persistence
export interface Slide {
  id?: number              // DB id (undefined for new slides)
  uid: string              // Stable client-side identity for dnd-kit
  slide_number: number
  slide_type: 'cover' | 'content' | 'cta'
  hook_text: string
  body_text: string
  cta_text: string
  overlay_opacity: number  // 0-1, default 0.5
  custom_background_path?: string
}

// System recommendation from balance engine
export interface BalanceRecommendation {
  pillar: string
  theme: string
  mechanic: string
  reasoning: 'cold_start_round_robin' | 'performance_weighted'
}

// Claude API generation result (structured JSON in response)
export interface GenerationResult {
  slides: Array<{
    slide_type: 'cover' | 'content' | 'cta'
    hook_text: string
    body_text: string
    cta_text: string
  }>
  caption: string
}

// Story proposal from Claude API
export interface StoryProposal {
  story_type: 'teaser' | 'reference' | 'deepening' | 'behind_the_scenes'
  tool_type: string        // e.g. 'poll', 'quiz', 'question'
  tool_content: string     // JSON with poll question/options, quiz question/answers, etc.
  timing: 'before' | 'after'
  source_slide_index: number  // Index into slides array
  text_content: string     // Story image text
  rationale: string        // Why this story was recommended
}

// File payload for export
export interface ExportFile {
  name: string             // e.g. '2026-03-11_coaching-transformation_slide-01.png'
  content: string          // base64 data URL for PNGs, plain text for .txt
}

// Balance warning for Step 1 UI
export interface BalanceWarning {
  variable_type: 'pillar' | 'mechanic' | 'theme'
  variable_value: string
  usage_count: number
  days_span: number
  message: string          // e.g. 'Hook mechanic used 4x in 2 weeks - rotate?'
}

// Learning dashboard data
export interface BalanceDashboardData {
  pillars: Array<{ name: string; actual_pct: number; target_pct: number; count: number }>
  mechanics: Array<{ name: string; count: number }>
  themes: Array<{ name: string; count: number }>
  total_posts: number
}
