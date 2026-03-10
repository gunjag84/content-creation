import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

let db: Database.Database | null = null

export function initDatabase(dbPath?: string): Database.Database {
  if (db) {
    return db
  }

  // Use provided path or default to userData
  const actualPath = dbPath || path.join(process.cwd(), 'content-creation.db')

  // Create parent directory if it doesn't exist
  const dir = path.dirname(actualPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const isNewDatabase = !fs.existsSync(actualPath)

  // Open database connection
  db = new Database(actualPath)

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL')

  // Set synchronous mode to NORMAL (faster, still safe with WAL)
  db.pragma('synchronous = NORMAL')

  // Enable foreign key constraints
  db.pragma('foreign_keys = ON')

  if (isNewDatabase) {
    // Load and execute schema for new database
    const schemaSQL = loadSchemaSQL()
    db.exec(schemaSQL)
  } else {
    // Run integrity check on existing database
    const result = db.prepare('PRAGMA quick_check').get() as { quick_check: string }
    if (result.quick_check !== 'ok') {
      throw new Error(`Database integrity check failed: ${result.quick_check}`)
    }
  }

  return db
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export function closeDatabase(): void {
  if (db) {
    // Checkpoint WAL file to main database before closing
    db.pragma('wal_checkpoint(TRUNCATE)')
    db.close()
    db = null
  }
}

function loadSchemaSQL(): string {
  // Try production path first (bundled with app)
  let schemaPath = path.join(__dirname, 'schema.sql')

  // Fallback to dev mode path
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.join(process.cwd(), 'src', 'main', 'db', 'schema.sql')
  }

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found at ${schemaPath}`)
  }

  return fs.readFileSync(schemaPath, 'utf-8')
}
