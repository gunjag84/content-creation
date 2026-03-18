import { z } from 'zod'

// --- Slide types ---

export interface ZoneOverride {
  fontSize?: number
  fontWeight?: 'normal' | 'bold' | '600' | '700'
  color?: string
  textAlign?: 'left' | 'center' | 'right'
  fontFamily?: string
}

export interface Slide {
  id?: number
  uid: string
  slide_number: number
  slide_type: 'cover' | 'content' | 'cta'
  hook_text: string
  body_text: string
  cta_text: string
  overlay_opacity: number
  custom_background_path?: string
  background_position_x?: number  // 0-100 (%), default 50
  background_position_y?: number  // 0-100 (%), default 50
  background_scale?: number       // 1.0-3.0 (transform scale), default 1.0
  zone_overrides?: Record<string, ZoneOverride>
}

export const GenerationResultSchema = z.object({
  slides: z.array(z.object({
    slide_type: z.enum(['cover', 'content', 'cta']),
    hook_text: z.string(),
    body_text: z.string(),
    cta_text: z.string()
  })).min(1),
  caption: z.string()
})

export type GenerationResult = z.infer<typeof GenerationResultSchema>

// --- Settings ---

const ContextDocsSchema = z.object({
  brandVoice: z.string().default(''),
  targetPersona: z.string().default(''),
  productUVP: z.string().default(''),
  competitive: z.string().default(''),
  contentStrategy: z.string().default(''),
  pov: z.string().default('')
})

const FontPathSchema = z.object({
  headline: z.string().default(''),
  body: z.string().default(''),
  cta: z.string().default('')
})

const FontLibraryEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string()
})

export type FontLibraryEntry = z.infer<typeof FontLibraryEntrySchema>

const VisualSchema = z.object({
  colors: z.array(z.string()).default(['#000000', '#666666', '#ffffff']),
  fonts: FontPathSchema.default({ headline: '', body: '', cta: '' }),
  fontLibrary: z.array(FontLibraryEntrySchema).default([]),
  logo: z.string().default(''),
  cta: z.string().default(''),
  handle: z.string().default('')
})

const PillarSchema = z.object({
  id: z.string(),
  name: z.string(),
  targetPct: z.number().min(0).max(100)
})

const ThemeSchema = z.object({
  id: z.string(),
  name: z.string()
})

const MechanicSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().default(''),
  slideRange: z.object({ min: z.number(), max: z.number() }).optional()
})

export const SettingsSchema = z.object({
  contextDocs: ContextDocsSchema.default({ brandVoice: '', targetPersona: '', productUVP: '', competitive: '', contentStrategy: '', pov: '' }),
  visual: VisualSchema.default({ colors: ['#000000', '#666666', '#ffffff'], fonts: { headline: '', body: '', cta: '' }, fontLibrary: [], logo: '', cta: '', handle: '' }),
  pillars: z.array(PillarSchema).default([]),
  themes: z.array(ThemeSchema).default([]),
  mechanics: z.array(MechanicSchema).default([])
})

export type Settings = z.infer<typeof SettingsSchema>
export type ContextDocs = z.infer<typeof ContextDocsSchema>

// --- Balance / Recommendation ---

export interface BalanceEntry {
  id: number
  variable_type: string
  variable_value: string
  usage_count: number
  last_used: number | null
  avg_performance: number | null
}

export interface BalanceRecommendation {
  pillar: string
  theme: string
  mechanic: string
  reasoning: 'cold_start_round_robin' | 'performance_weighted'
}

export interface BalanceWarning {
  variable_type: 'pillar' | 'mechanic' | 'theme'
  variable_value: string
  usage_count: number
  days_span: number
  message: string
}

export interface BalanceDashboardData {
  pillars: Array<{ name: string; actual_pct: number; target_pct: number; count: number }>
  mechanics: Array<{ name: string; count: number; avg_performance: number | null }>
  themes: Array<{ name: string; count: number; avg_performance: number | null }>
  total_posts: number
}

// --- Post types ---

export interface PostRow {
  id: number
  pillar: string
  theme: string
  mechanic: string
  content_type: 'single' | 'carousel'
  caption: string | null
  slide_count: number | null
  impulse: string | null
  background_path: string | null
  template_id: number | null
  ad_hoc: number
  status: 'draft' | 'approved' | 'exported'
  created_at: number
}

export interface SlideRow {
  id: number
  post_id: number
  slide_number: number
  slide_type: 'cover' | 'content' | 'cta'
  hook_text: string | null
  body_text: string | null
  cta_text: string | null
  overlay_opacity: number
  custom_background_path: string | null
  background_position_x: number | null
  background_position_y: number | null
  background_scale: number | null
  zone_overrides: string | null
  created_at: number
}

export interface PostPerformance {
  id: number
  post_id: number
  reach: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  saves: number | null
  ad_spend: number | null
  cost_per_result: number | null
  link_clicks: number | null
  notes: string | null
  recorded_at: number
}
