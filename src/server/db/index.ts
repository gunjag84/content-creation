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

    // MECE dimension migration: theme+mechanic -> area+approach+method+tonality
    if (!cols.includes('area')) {
      db.exec('ALTER TABLE posts ADD COLUMN area TEXT')
      db.exec('ALTER TABLE posts ADD COLUMN approach TEXT')
      db.exec('ALTER TABLE posts ADD COLUMN method TEXT')
      db.exec('ALTER TABLE posts ADD COLUMN tonality TEXT')

      // Migrate existing data with hardcoded mappings
      const themeMigrationMap: Record<string, { area: string | null, approach: string | null }> = {
        'Alltag berufstaetiger Muetter':               { area: 'L3 Alltagslogistik',           approach: null },
        'Alltag berufstätiger Mütter':                 { area: 'L3 Alltagslogistik',           approach: null },
        'Wissenschaft des Glücks und der Dankbarkeit': { area: 'L2 Innere Welt',               approach: 'A1 Dankbarkeit & WEIL3' },
        'Wissenschaft des Gluecks und der Dankbarkeit':{ area: 'L2 Innere Welt',               approach: 'A1 Dankbarkeit & WEIL3' },
        'Analoge Rituale als Gegenbewegung':           { area: 'L5 Produkt & Angebot',         approach: 'A2 Achtsamkeit & Rituale' },
        'Produkt und Erlebnis':                        { area: 'L5 Produkt & Angebot',         approach: null },
        'Marke und Community':                         { area: 'L6 Marke & Gründerin',         approach: null },
      }
      const mechanicMigrationMap: Record<string, string> = {
        'Provokative Frage':         'M1 Provokante These',
        'Polarisierende Aussage':    'M1 Provokante These',
        'Storytelling':              'M3 Persönliche Geschichte',
        'Listicle / How-To':         'M8 Liste',
        'Myth-Busting':              'M9 Mythos vs. Realität',
        'Social Proof / Testimonial':'M5 Testimonial',
        'Behind the Scenes':         'M12 Behind the Scenes',
      }

      // Apply mappings to existing rows
      if (cols.includes('theme')) {
        const rows = db.prepare('SELECT id, theme, mechanic FROM posts').all() as Array<{ id: number; theme: string; mechanic: string }>
        const updateStmt = db.prepare('UPDATE posts SET area = ?, approach = ?, method = ? WHERE id = ?')
        for (const row of rows) {
          const themeMap = themeMigrationMap[row.theme]
          const methodVal = mechanicMigrationMap[row.mechanic] || null
          updateStmt.run(
            themeMap?.area ?? null,
            themeMap?.approach ?? null,
            methodVal,
            row.id
          )
        }
      }

      // Rebuild posts table without theme/mechanic columns
      db.exec(`
        CREATE TABLE posts_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pillar TEXT NOT NULL,
          area TEXT,
          approach TEXT,
          method TEXT,
          tonality TEXT,
          content_type TEXT NOT NULL DEFAULT 'carousel' CHECK(content_type IN ('single', 'carousel')),
          caption TEXT,
          slide_count INTEGER DEFAULT 1,
          impulse TEXT,
          background_path TEXT,
          template_id INTEGER,
          ad_hoc INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'approved', 'exported')),
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        )
      `)
      db.exec(`
        INSERT INTO posts_new (id, pillar, area, approach, method, tonality, content_type, caption, slide_count, impulse, background_path, template_id, ad_hoc, status, created_at)
        SELECT id, pillar, area, approach, method, tonality, content_type, caption, slide_count, impulse, background_path, template_id, ad_hoc, status, created_at
        FROM posts
      `)
      db.exec('DROP TABLE posts')
      db.exec('ALTER TABLE posts_new RENAME TO posts')

      // Clean stale balance entries and rebuild from migrated posts
      db.exec("DELETE FROM balance_matrix WHERE variable_type IN ('theme', 'mechanic')")

      // Recalculate balance for new dimensions from existing posts
      const migrated = db.prepare('SELECT area, approach, method, tonality FROM posts').all() as Array<{ area: string | null; approach: string | null; method: string | null; tonality: string | null }>
      const upsertBalance = db.prepare(`
        INSERT INTO balance_matrix (variable_type, variable_value, usage_count, last_used)
        VALUES (?, ?, 1, strftime('%s', 'now'))
        ON CONFLICT(variable_type, variable_value)
        DO UPDATE SET usage_count = usage_count + 1, last_used = strftime('%s', 'now')
      `)
      for (const row of migrated) {
        if (row.area) upsertBalance.run('area', row.area)
        if (row.approach) upsertBalance.run('approach', row.approach)
        if (row.method) upsertBalance.run('method', row.method)
        if (row.tonality) upsertBalance.run('tonality', row.tonality)
      }
    }

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

    if (!tables.includes('ig_posts')) {
      db.exec(`CREATE TABLE ig_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ig_media_id TEXT NOT NULL UNIQUE,
        caption TEXT,
        media_type TEXT,
        permalink TEXT,
        timestamp TEXT,
        reach INTEGER,
        likes INTEGER,
        comments INTEGER,
        shares INTEGER,
        saves INTEGER,
        ad_spend REAL,
        cost_per_result REAL,
        link_clicks INTEGER,
        performance_score REAL DEFAULT 0,
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
