// Saved visual configuration preset for reuse across slides
export interface SlidePreset {
  id: string
  name: string
  template_id?: number
  zone_overrides: Record<string, ZoneOverride>
  overlay_opacity?: number
  created_at: number
}

// Per-zone visual overrides applied at render time (merged over template zone defaults)
export interface ZoneOverride {
  x?: number
  y?: number
  width?: number
  height?: number
  fontSize?: number
  fontWeight?: 'normal' | 'bold' | '600' | '700'
  color?: string
}

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
  zone_overrides?: Record<string, ZoneOverride>  // per-zone style overrides keyed by zone id
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
  mechanics: Array<{ name: string; count: number; avg_performance: number | null }>
  themes: Array<{ name: string; count: number; avg_performance: number | null }>
  total_posts: number
}
