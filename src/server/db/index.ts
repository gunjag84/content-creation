import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

let db: Database.Database | null = null

export function initDatabase(dbPath?: string): Database.Database {
  if (db) return db

  const actualPath = dbPath || path.join(process.cwd(), 'data', 'content-creation.db')
  const dir = path.dirname(actualPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const isNew = !fs.existsSync(actualPath)
  db = new Database(actualPath)
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')
  db.pragma('foreign_keys = ON')

  if (isNew) {
    const schemaPath = path.join(__dirname, 'schema.sql')
    const fallback = path.join(process.cwd(), 'src', 'server', 'db', 'schema.sql')
    const sql = fs.existsSync(schemaPath)
      ? fs.readFileSync(schemaPath, 'utf-8')
      : fs.readFileSync(fallback, 'utf-8')
    db.exec(sql)
  } else {
    // Migrate existing DBs
    const cols = (db.prepare('PRAGMA table_info(posts)').all() as { name: string }[]).map(c => c.name)
    if (!cols.includes('template_id')) db.exec('ALTER TABLE posts ADD COLUMN template_id INTEGER')
    if (!cols.includes('ad_hoc')) db.exec('ALTER TABLE posts ADD COLUMN ad_hoc INTEGER NOT NULL DEFAULT 0')

    const slideCols = (db.prepare('PRAGMA table_info(slides)').all() as { name: string }[]).map(c => c.name)
    if (!slideCols.includes('background_position_x')) db.exec('ALTER TABLE slides ADD COLUMN background_position_x REAL DEFAULT 50')
    if (!slideCols.includes('background_position_y')) db.exec('ALTER TABLE slides ADD COLUMN background_position_y REAL DEFAULT 50')
    if (!slideCols.includes('background_scale')) db.exec('ALTER TABLE slides ADD COLUMN background_scale REAL DEFAULT 1.0')

    // Instagram integration tables
    const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]).map(t => t.name)
    if (!tables.includes('meta_tokens')) {
      db.exec(`CREATE TABLE meta_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        access_token TEXT NOT NULL,
        ig_user_id TEXT NOT NULL,
        ig_username TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )`)
    }
    if (!tables.includes('story_stats')) {
      db.exec(`CREATE TABLE story_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ig_media_id TEXT NOT NULL UNIQUE,
        impressions INTEGER,
        reach INTEGER,
        replies INTEGER,
        taps_forward INTEGER,
        taps_back INTEGER,
        exits INTEGER,
        recorded_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )`)
    }

    // Add performance_score, source, ig_media_id to post_performance
    const perfCols = (db.prepare('PRAGMA table_info(post_performance)').all() as { name: string }[]).map(c => c.name)
    if (!perfCols.includes('performance_score')) db.exec('ALTER TABLE post_performance ADD COLUMN performance_score REAL DEFAULT 0')
    if (!perfCols.includes('source')) db.exec("ALTER TABLE post_performance ADD COLUMN source TEXT DEFAULT 'manual'")
    if (!perfCols.includes('ig_media_id')) db.exec('ALTER TABLE post_performance ADD COLUMN ig_media_id TEXT')
  }

  return db
}

export function getDatabase(): Database.Database {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.')
  return db
}

export function closeDatabase(): void {
  if (db) {
    db.pragma('wal_checkpoint(TRUNCATE)')
    db.close()
    db = null
  }
}
