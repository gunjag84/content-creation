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
