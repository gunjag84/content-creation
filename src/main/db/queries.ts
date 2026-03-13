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

// Slide operations
export interface SlideInsert {
  post_id: number
  slide_number: number
  slide_type: 'cover' | 'content' | 'cta'
  hook_text: string
  body_text: string
  cta_text: string
  overlay_opacity: number
  custom_background_path?: string
}

export interface Slide extends SlideInsert {
  id: number
  created_at: number
}

export function insertSlide(data: SlideInsert): number {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO slides (
      post_id, slide_number, slide_type, hook_text, body_text, cta_text,
      overlay_opacity, custom_background_path
    ) VALUES (
      @post_id, @slide_number, @slide_type, @hook_text, @body_text, @cta_text,
      @overlay_opacity, @custom_background_path
    )
  `)

  const result = stmt.run({
    post_id: data.post_id,
    slide_number: data.slide_number,
    slide_type: data.slide_type,
    hook_text: data.hook_text,
    body_text: data.body_text,
    cta_text: data.cta_text,
    overlay_opacity: data.overlay_opacity,
    custom_background_path: data.custom_background_path ?? null
  })

  return result.lastInsertRowid as number
}

export function getSlidesByPost(postId: number): Slide[] {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM slides WHERE post_id = ? ORDER BY slide_number ASC')
  return stmt.all(postId) as Slide[]
}

export function updatePostStatus(postId: number, status: 'draft' | 'approved' | 'exported'): void {
  const db = getDatabase()
  const stmt = db.prepare(`
    UPDATE posts
    SET status = ?, updated_at = strftime('%s', 'now')
    WHERE id = ?
  `)
  stmt.run(status, postId)
}

export interface PostWithSlides {
  post: Post
  slides: Slide[]
}

export function getPostWithSlides(postId: number): PostWithSlides {
  const post = getPost(postId)
  if (!post) {
    throw new Error(`Post ${postId} not found`)
  }

  const slides = getSlidesByPost(postId)

  return {
    post,
    slides
  }
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

export interface SettingsVersion {
  id: number
  brand_id: number
  filename: string
  timestamp: number
}

export function listSettingsVersions(brandId?: number): SettingsVersion[] {
  const db = getDatabase()
  if (brandId !== undefined) {
    const stmt = db.prepare('SELECT * FROM settings_versions WHERE brand_id = ? ORDER BY timestamp DESC')
    return stmt.all(brandId) as SettingsVersion[]
  } else {
    const stmt = db.prepare('SELECT * FROM settings_versions ORDER BY timestamp DESC')
    return stmt.all() as SettingsVersion[]
  }
}

export function getSettingsVersionAtTime(timestamp: number, brandId?: number): SettingsVersion | undefined {
  const db = getDatabase()
  if (brandId !== undefined) {
    const stmt = db.prepare(`
      SELECT * FROM settings_versions
      WHERE brand_id = ? AND timestamp <= ?
      ORDER BY timestamp DESC
      LIMIT 1
    `)
    return stmt.get(brandId, timestamp) as SettingsVersion | undefined
  } else {
    const stmt = db.prepare(`
      SELECT * FROM settings_versions
      WHERE timestamp <= ?
      ORDER BY timestamp DESC
      LIMIT 1
    `)
    return stmt.get(timestamp) as SettingsVersion | undefined
  }
}

export function getSettingsVersionForPost(postId: number): SettingsVersion | undefined {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT sv.* FROM settings_versions sv
    JOIN posts p ON p.settings_version_id = sv.id
    WHERE p.id = ?
  `)
  return stmt.get(postId) as SettingsVersion | undefined
}

// Template operations
export interface TemplateInsert {
  brand_id?: number
  name: string
  background_type: 'image' | 'solid_color' | 'gradient'
  background_value: string
  overlay_color?: string
  overlay_opacity?: number
  overlay_gradient?: string
  overlay_enabled?: boolean
  format: 'feed' | 'story'
  zones_config: string // JSON string of Zone[]
}

export interface Template extends TemplateInsert {
  id: number
  created_at: number
  updated_at: number
}

export function insertTemplate(data: TemplateInsert): number {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO templates (
      brand_id, name, background_type, background_value, overlay_color,
      overlay_opacity, overlay_gradient, overlay_enabled, format, zones_config
    ) VALUES (
      @brand_id, @name, @background_type, @background_value, @overlay_color,
      @overlay_opacity, @overlay_gradient, @overlay_enabled, @format, @zones_config
    )
  `)

  const result = stmt.run({
    brand_id: data.brand_id ?? 1,
    name: data.name,
    background_type: data.background_type,
    background_value: data.background_value,
    overlay_color: data.overlay_color ?? null,
    overlay_opacity: data.overlay_opacity ?? 0.5,
    overlay_gradient: data.overlay_gradient ?? null,
    overlay_enabled: data.overlay_enabled !== undefined ? (data.overlay_enabled ? 1 : 0) : 1,
    format: data.format,
    zones_config: data.zones_config
  })

  return result.lastInsertRowid as number
}

export function getTemplate(id: number): Template | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM templates WHERE id = ?')
  return stmt.get(id) as Template | undefined
}

export function listTemplates(brandId?: number): Template[] {
  const db = getDatabase()
  if (brandId !== undefined) {
    const stmt = db.prepare('SELECT * FROM templates WHERE brand_id = ? ORDER BY created_at DESC')
    return stmt.all(brandId) as Template[]
  } else {
    const stmt = db.prepare('SELECT * FROM templates ORDER BY created_at DESC')
    return stmt.all() as Template[]
  }
}

export function updateTemplate(id: number, data: Partial<TemplateInsert>): void {
  const db = getDatabase()
  const fields: string[] = []
  const values: any = { id }

  if (data.name !== undefined) {
    fields.push('name = @name')
    values.name = data.name
  }
  if (data.background_type !== undefined) {
    fields.push('background_type = @background_type')
    values.background_type = data.background_type
  }
  if (data.background_value !== undefined) {
    fields.push('background_value = @background_value')
    values.background_value = data.background_value
  }
  if (data.overlay_color !== undefined) {
    fields.push('overlay_color = @overlay_color')
    values.overlay_color = data.overlay_color
  }
  if (data.overlay_opacity !== undefined) {
    fields.push('overlay_opacity = @overlay_opacity')
    values.overlay_opacity = data.overlay_opacity
  }
  if (data.overlay_gradient !== undefined) {
    fields.push('overlay_gradient = @overlay_gradient')
    values.overlay_gradient = data.overlay_gradient
  }
  if (data.overlay_enabled !== undefined) {
    fields.push('overlay_enabled = @overlay_enabled')
    values.overlay_enabled = data.overlay_enabled ? 1 : 0
  }
  if (data.format !== undefined) {
    fields.push('format = @format')
    values.format = data.format
  }
  if (data.zones_config !== undefined) {
    fields.push('zones_config = @zones_config')
    values.zones_config = data.zones_config
  }

  if (fields.length === 0) return

  fields.push("updated_at = strftime('%s', 'now')")

  const stmt = db.prepare(`
    UPDATE templates
    SET ${fields.join(', ')}
    WHERE id = @id
  `)

  stmt.run(values)
}

export function deleteTemplate(id: number): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM templates WHERE id = ?')
  stmt.run(id)
}

export function duplicateTemplate(id: number, newName: string): number {
  const db = getDatabase()
  const source = getTemplate(id)
  if (!source) {
    throw new Error(`Template ${id} not found`)
  }

  return insertTemplate({
    brand_id: source.brand_id,
    name: newName,
    background_type: source.background_type,
    background_value: source.background_value,
    overlay_color: source.overlay_color ?? undefined,
    overlay_opacity: source.overlay_opacity ?? undefined,
    overlay_gradient: source.overlay_gradient ?? undefined,
    overlay_enabled: Boolean(source.overlay_enabled),
    format: source.format,
    zones_config: source.zones_config
  })
}
