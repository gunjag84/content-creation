import { getDatabase } from './index'
import type { PostRow, SlideRow, PostPerformance, BalanceEntry } from '../../shared/types'

// --- Post operations ---

export interface PostInsert {
  pillar: string
  theme: string
  mechanic: string
  content_type: 'single' | 'carousel'
  caption?: string
  slide_count?: number
  impulse?: string
  background_path?: string
  status?: 'draft' | 'approved' | 'exported'
}

export function insertPost(data: PostInsert): number {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO posts (pillar, theme, mechanic, content_type, caption, slide_count, impulse, background_path, status)
    VALUES (@pillar, @theme, @mechanic, @content_type, @caption, @slide_count, @impulse, @background_path, @status)
  `)
  const result = stmt.run({
    pillar: data.pillar,
    theme: data.theme,
    mechanic: data.mechanic,
    content_type: data.content_type,
    caption: data.caption ?? null,
    slide_count: data.slide_count ?? null,
    impulse: data.impulse ?? null,
    background_path: data.background_path ?? null,
    status: data.status ?? 'draft'
  })
  return result.lastInsertRowid as number
}

export function getPost(id: number): PostRow | undefined {
  const db = getDatabase()
  return db.prepare('SELECT * FROM posts WHERE id = ?').get(id) as PostRow | undefined
}

export function listPosts(limit = 50, offset = 0): PostRow[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM posts ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset) as PostRow[]
}

export function updatePostStatus(id: number, status: 'draft' | 'approved' | 'exported'): void {
  const db = getDatabase()
  db.prepare('UPDATE posts SET status = ? WHERE id = ?').run(status, id)
}

// --- Slide operations ---

export interface SlideInsert {
  post_id: number
  slide_number: number
  slide_type: 'cover' | 'content' | 'cta'
  hook_text?: string
  body_text?: string
  cta_text?: string
  overlay_opacity?: number
  custom_background_path?: string
  zone_overrides?: string
}

export function insertSlide(data: SlideInsert): number {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO slides (post_id, slide_number, slide_type, hook_text, body_text, cta_text, overlay_opacity, custom_background_path, zone_overrides)
    VALUES (@post_id, @slide_number, @slide_type, @hook_text, @body_text, @cta_text, @overlay_opacity, @custom_background_path, @zone_overrides)
  `)
  const result = stmt.run({
    post_id: data.post_id,
    slide_number: data.slide_number,
    slide_type: data.slide_type,
    hook_text: data.hook_text ?? null,
    body_text: data.body_text ?? null,
    cta_text: data.cta_text ?? null,
    overlay_opacity: data.overlay_opacity ?? 0.5,
    custom_background_path: data.custom_background_path ?? null,
    zone_overrides: data.zone_overrides ?? null
  })
  return result.lastInsertRowid as number
}

export function getSlidesByPost(postId: number): SlideRow[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM slides WHERE post_id = ? ORDER BY slide_number ASC').all(postId) as SlideRow[]
}

// --- Performance operations ---

export function upsertPerformance(postId: number, data: Partial<Omit<PostPerformance, 'id' | 'post_id' | 'recorded_at'>>): void {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO post_performance (post_id, reach, likes, comments, shares, saves, ad_spend, cost_per_result, link_clicks, notes)
    VALUES (@post_id, @reach, @likes, @comments, @shares, @saves, @ad_spend, @cost_per_result, @link_clicks, @notes)
    ON CONFLICT(post_id) DO UPDATE SET
      reach = @reach, likes = @likes, comments = @comments, shares = @shares,
      saves = @saves, ad_spend = @ad_spend, cost_per_result = @cost_per_result,
      link_clicks = @link_clicks, notes = @notes,
      recorded_at = strftime('%s', 'now')
  `)
  stmt.run({
    post_id: postId,
    reach: data.reach ?? null,
    likes: data.likes ?? null,
    comments: data.comments ?? null,
    shares: data.shares ?? null,
    saves: data.saves ?? null,
    ad_spend: data.ad_spend ?? null,
    cost_per_result: data.cost_per_result ?? null,
    link_clicks: data.link_clicks ?? null,
    notes: data.notes ?? null
  })
}

export function getPerformance(postId: number): PostPerformance | undefined {
  const db = getDatabase()
  return db.prepare('SELECT * FROM post_performance WHERE post_id = ?').get(postId) as PostPerformance | undefined
}

// --- Balance matrix operations ---

export function updateBalanceMatrix(type: string, value: string): void {
  const db = getDatabase()
  db.prepare(`
    INSERT INTO balance_matrix (variable_type, variable_value, usage_count, last_used)
    VALUES (@type, @value, 1, strftime('%s', 'now'))
    ON CONFLICT(variable_type, variable_value)
    DO UPDATE SET usage_count = usage_count + 1, last_used = strftime('%s', 'now')
  `).run({ type, value })
}

export function updateBalancePerformance(type: string, value: string, avgPerf: number): void {
  const db = getDatabase()
  db.prepare(`
    UPDATE balance_matrix SET avg_performance = ? WHERE variable_type = ? AND variable_value = ?
  `).run(avgPerf, type, value)
}

export function getBalanceMatrix(): BalanceEntry[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM balance_matrix ORDER BY variable_type, usage_count DESC').all() as BalanceEntry[]
}

// --- Stats aggregation ---

export function getAvgPerformanceByDimension(dimension: 'pillar' | 'theme' | 'mechanic'): Array<{ name: string; avg_performance: number }> {
  const db = getDatabase()
  const column = dimension === 'pillar' ? 'p.pillar' : dimension === 'theme' ? 'p.theme' : 'p.mechanic'
  return db.prepare(`
    SELECT ${column} as name, AVG(
      COALESCE(pp.reach, 0) + COALESCE(pp.likes, 0) * 2 + COALESCE(pp.comments, 0) * 3 + COALESCE(pp.shares, 0) * 4 + COALESCE(pp.saves, 0) * 3
    ) as avg_performance
    FROM posts p
    JOIN post_performance pp ON pp.post_id = p.id
    GROUP BY ${column}
  `).all() as Array<{ name: string; avg_performance: number }>
}
