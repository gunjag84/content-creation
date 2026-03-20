import { getDatabase } from './index'
import type { PostRow, SlideRow, PostPerformance, BalanceEntry, MetaToken } from '../../shared/types'
import { computePerformanceScore } from '../../shared/performanceScore'

// --- Post operations ---

export interface PostInsert {
  pillar: string
  scenario: string
  method: string
  content_type: 'single' | 'carousel'
  caption?: string
  slide_count?: number
  impulse?: string
  background_path?: string
  template_id?: number
  ad_hoc?: number
  status?: 'draft' | 'approved' | 'exported'
  situationId?: string | null
  scienceId?: string | null
  hookStrategy?: string | null
  ctaStrategy?: string | null
}

export function insertPost(data: PostInsert): number {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO posts (pillar, scenario, method, content_type, caption, slide_count, impulse, background_path, template_id, ad_hoc, status, situation_id, science_id, hook_strategy, cta_strategy)
    VALUES (@pillar, @scenario, @method, @content_type, @caption, @slide_count, @impulse, @background_path, @template_id, @ad_hoc, @status, @situation_id, @science_id, @hook_strategy, @cta_strategy)
  `)
  const result = stmt.run({
    pillar: data.pillar,
    scenario: data.scenario,
    method: data.method,
    content_type: data.content_type,
    caption: data.caption ?? null,
    slide_count: data.slide_count ?? null,
    impulse: data.impulse ?? null,
    background_path: data.background_path ?? null,
    template_id: data.template_id ?? null,
    ad_hoc: data.ad_hoc ?? 0,
    status: data.status ?? 'draft',
    situation_id: data.situationId ?? null,
    science_id: data.scienceId ?? null,
    hook_strategy: data.hookStrategy ?? null,
    cta_strategy: data.ctaStrategy ?? null
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

export interface PostWithScore extends PostRow {
  performance_score: number | null
  perf_source: string | null
}

export function listPostsWithScores(limit = 50, offset = 0): PostWithScore[] {
  const db = getDatabase()
  return db.prepare(`
    SELECT p.*, pp.performance_score, pp.source as perf_source
    FROM posts p
    LEFT JOIN post_performance pp ON pp.post_id = p.id
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset) as PostWithScore[]
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
  background_position_x?: number
  background_position_y?: number
  background_scale?: number
  zone_overrides?: string
}

export function insertSlide(data: SlideInsert): number {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO slides (post_id, slide_number, slide_type, hook_text, body_text, cta_text, overlay_opacity, custom_background_path, background_position_x, background_position_y, background_scale, zone_overrides)
    VALUES (@post_id, @slide_number, @slide_type, @hook_text, @body_text, @cta_text, @overlay_opacity, @custom_background_path, @background_position_x, @background_position_y, @background_scale, @zone_overrides)
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
    background_position_x: data.background_position_x ?? 50,
    background_position_y: data.background_position_y ?? 50,
    background_scale: data.background_scale ?? 1.0,
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
  const score = computePerformanceScore(data)
  const stmt = db.prepare(`
    INSERT INTO post_performance (post_id, reach, likes, comments, shares, saves, ad_spend, cost_per_result, link_clicks, notes, performance_score, source, ig_media_id)
    VALUES (@post_id, @reach, @likes, @comments, @shares, @saves, @ad_spend, @cost_per_result, @link_clicks, @notes, @performance_score, @source, @ig_media_id)
    ON CONFLICT(post_id) DO UPDATE SET
      reach = @reach, likes = @likes, comments = @comments, shares = @shares,
      saves = @saves, ad_spend = @ad_spend, cost_per_result = @cost_per_result,
      link_clicks = @link_clicks, notes = @notes,
      performance_score = @performance_score, source = @source, ig_media_id = @ig_media_id,
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
    notes: data.notes ?? null,
    performance_score: score,
    source: data.source ?? 'manual',
    ig_media_id: data.ig_media_id ?? null
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

// --- Meta token operations ---

export function getMetaToken(): MetaToken | undefined {
  const db = getDatabase()
  return db.prepare('SELECT * FROM meta_tokens ORDER BY id DESC LIMIT 1').get() as MetaToken | undefined
}

export function saveMetaToken(data: Omit<MetaToken, 'id' | 'created_at'>): void {
  const db = getDatabase()
  // Delete any existing tokens first (single-user app, one token at a time)
  db.prepare('DELETE FROM meta_tokens').run()
  db.prepare(`
    INSERT INTO meta_tokens (access_token, ig_user_id, ig_username, expires_at)
    VALUES (@access_token, @ig_user_id, @ig_username, @expires_at)
  `).run(data)
}

export function deleteMetaToken(): void {
  const db = getDatabase()
  db.prepare('DELETE FROM meta_tokens').run()
}

/**
 * Link an IG post to a local post by setting ig_media_id on the performance row.
 * Creates a performance row if one doesn't exist.
 */
export function linkIgPost(igMediaId: string, postId: number): void {
  const db = getDatabase()
  const existing = db.prepare('SELECT id FROM post_performance WHERE post_id = ?').get(postId)
  if (existing) {
    db.prepare('UPDATE post_performance SET ig_media_id = ?, source = ? WHERE post_id = ?').run(igMediaId, 'api', postId)
  } else {
    db.prepare(`
      INSERT INTO post_performance (post_id, ig_media_id, source, performance_score)
      VALUES (?, ?, 'api', 0)
    `).run(postId, igMediaId)
  }
}

// --- Stats aggregation ---

export function getAvgPerformanceByDimension(dimension: 'pillar' | 'scenario' | 'method'): Array<{ name: string; avg_performance: number }> {
  const db = getDatabase()
  const columnMap: Record<string, string> = {
    pillar: 'p.pillar', scenario: 'p.scenario',
    method: 'p.method'
  }
  const column = columnMap[dimension]
  if (!column) return []
  return db.prepare(`
    SELECT ${column} as name, AVG(
      COALESCE(pp.reach, 0) + COALESCE(pp.likes, 0) * 2 + COALESCE(pp.comments, 0) * 3 + COALESCE(pp.shares, 0) * 4 + COALESCE(pp.saves, 0) * 3
    ) as avg_performance
    FROM posts p
    JOIN post_performance pp ON pp.post_id = p.id
    WHERE ${column} IS NOT NULL
    GROUP BY ${column}
  `).all() as Array<{ name: string; avg_performance: number }>
}

// --- Standalone IG posts (not created in Content Studio) ---

export interface IgPostRow {
  id: number
  ig_media_id: string
  caption: string | null
  media_type: string | null
  permalink: string | null
  timestamp: string | null
  reach: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  saves: number | null
  ad_spend: number | null
  cost_per_result: number | null
  link_clicks: number | null
  performance_score: number
  recorded_at: number
}

export function upsertIgPost(data: {
  ig_media_id: string
  caption?: string | null
  media_type?: string | null
  permalink?: string | null
  timestamp?: string | null
  reach?: number | null
  likes?: number | null
  comments?: number | null
  shares?: number | null
  saves?: number | null
  ad_spend?: number | null
  cost_per_result?: number | null
  link_clicks?: number | null
  performance_score?: number
}): void {
  const db = getDatabase()
  db.prepare(`
    INSERT INTO ig_posts (ig_media_id, caption, media_type, permalink, timestamp, reach, likes, comments, shares, saves, ad_spend, cost_per_result, link_clicks, performance_score)
    VALUES (@ig_media_id, @caption, @media_type, @permalink, @timestamp, @reach, @likes, @comments, @shares, @saves, @ad_spend, @cost_per_result, @link_clicks, @performance_score)
    ON CONFLICT(ig_media_id) DO UPDATE SET
      reach = COALESCE(@reach, ig_posts.reach),
      likes = COALESCE(@likes, ig_posts.likes),
      comments = COALESCE(@comments, ig_posts.comments),
      shares = COALESCE(@shares, ig_posts.shares),
      saves = COALESCE(@saves, ig_posts.saves),
      ad_spend = COALESCE(@ad_spend, ig_posts.ad_spend),
      cost_per_result = COALESCE(@cost_per_result, ig_posts.cost_per_result),
      link_clicks = COALESCE(@link_clicks, ig_posts.link_clicks),
      performance_score = COALESCE(@performance_score, ig_posts.performance_score),
      recorded_at = strftime('%s', 'now')
  `).run({
    ig_media_id: data.ig_media_id,
    caption: data.caption ?? null,
    media_type: data.media_type ?? null,
    permalink: data.permalink ?? null,
    timestamp: data.timestamp ?? null,
    reach: data.reach ?? null,
    likes: data.likes ?? null,
    comments: data.comments ?? null,
    shares: data.shares ?? null,
    saves: data.saves ?? null,
    ad_spend: data.ad_spend ?? null,
    cost_per_result: data.cost_per_result ?? null,
    link_clicks: data.link_clicks ?? null,
    performance_score: data.performance_score ?? 0
  })
}

export function listIgPosts(): IgPostRow[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM ig_posts ORDER BY timestamp DESC').all() as IgPostRow[]
}
