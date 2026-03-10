import { getDatabase } from './index'

// Type definitions
export interface PostInsert {
  brand_id?: number
  pillar: string
  theme: string
  subtopic?: string
  key_message?: string
  mechanic: string
  template_id?: number
  content_type: 'single' | 'carousel'
  caption?: string
  slide_count?: number
  ad_hoc?: number
  settings_version_id?: number
  impulse?: string
  status?: 'draft' | 'approved' | 'exported'
  published_at?: number
}

export interface Post extends PostInsert {
  id: number
  created_at: number
  updated_at: number
}

export interface StoryInsert {
  brand_id?: number
  post_id: number
  story_type: 'teaser' | 'reference' | 'deepening' | 'behind_the_scenes'
  tool_type?: string
  tool_content?: string
  timing?: 'before' | 'after'
  source_slide_id?: number
  status?: 'draft' | 'approved' | 'exported'
}

export interface Story extends StoryInsert {
  id: number
  created_at: number
}

export interface BalanceEntry {
  id: number
  brand_id: number
  variable_type: string
  variable_value: string
  usage_count: number
  last_used: number | null
  avg_performance: number | null
}

// Post operations
export function insertPost(data: PostInsert): number {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO posts (
      brand_id, pillar, theme, subtopic, key_message, mechanic,
      template_id, content_type, caption, slide_count, ad_hoc,
      settings_version_id, impulse, status, published_at
    ) VALUES (
      @brand_id, @pillar, @theme, @subtopic, @key_message, @mechanic,
      @template_id, @content_type, @caption, @slide_count, @ad_hoc,
      @settings_version_id, @impulse, @status, @published_at
    )
  `)

  const result = stmt.run({
    brand_id: data.brand_id ?? 1,
    pillar: data.pillar,
    theme: data.theme,
    subtopic: data.subtopic ?? null,
    key_message: data.key_message ?? null,
    mechanic: data.mechanic,
    template_id: data.template_id ?? null,
    content_type: data.content_type,
    caption: data.caption ?? null,
    slide_count: data.slide_count ?? null,
    ad_hoc: data.ad_hoc ?? 0,
    settings_version_id: data.settings_version_id ?? null,
    impulse: data.impulse ?? null,
    status: data.status ?? 'draft',
    published_at: data.published_at ?? null
  })

  return result.lastInsertRowid as number
}

export function getPost(id: number): Post | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM posts WHERE id = ?')
  return stmt.get(id) as Post | undefined
}

export function listPosts(brandId?: number): Post[] {
  const db = getDatabase()
  if (brandId !== undefined) {
    const stmt = db.prepare('SELECT * FROM posts WHERE brand_id = ? ORDER BY created_at DESC')
    return stmt.all(brandId) as Post[]
  } else {
    const stmt = db.prepare('SELECT * FROM posts ORDER BY created_at DESC')
    return stmt.all() as Post[]
  }
}

// Story operations
export function insertStory(data: StoryInsert): number {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO stories (
      brand_id, post_id, story_type, tool_type, tool_content,
      timing, source_slide_id, status
    ) VALUES (
      @brand_id, @post_id, @story_type, @tool_type, @tool_content,
      @timing, @source_slide_id, @status
    )
  `)

  const result = stmt.run({
    brand_id: data.brand_id ?? 1,
    post_id: data.post_id,
    story_type: data.story_type,
    tool_type: data.tool_type ?? null,
    tool_content: data.tool_content ?? null,
    timing: data.timing ?? null,
    source_slide_id: data.source_slide_id ?? null,
    status: data.status ?? 'draft'
  })

  return result.lastInsertRowid as number
}

export function getStoriesByPost(postId: number): Story[] {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM stories WHERE post_id = ? ORDER BY created_at ASC')
  return stmt.all(postId) as Story[]
}

// Balance matrix operations
export function updateBalanceMatrix(
  brandId: number,
  type: string,
  value: string
): void {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO balance_matrix (brand_id, variable_type, variable_value, usage_count, last_used)
    VALUES (@brand_id, @type, @value, 1, strftime('%s', 'now'))
    ON CONFLICT(brand_id, variable_type, variable_value)
    DO UPDATE SET
      usage_count = usage_count + 1,
      last_used = strftime('%s', 'now')
  `)

  stmt.run({ brand_id: brandId, type, value })
}

export function getBalanceMatrix(brandId: number): BalanceEntry[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM balance_matrix
    WHERE brand_id = ?
    ORDER BY variable_type, usage_count DESC
  `)
  return stmt.all(brandId) as BalanceEntry[]
}

// Settings version operations
export function insertSettingsVersion(
  brandId: number,
  filename: string,
  timestamp: number
): number {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO settings_versions (brand_id, filename, timestamp)
    VALUES (?, ?, ?)
  `)

  const result = stmt.run(brandId, filename, timestamp)
  return result.lastInsertRowid as number
}
