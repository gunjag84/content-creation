import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { initDatabase, getDatabase, closeDatabase } from '@main/db/index'
import { createTempDbPath, cleanupTempDir } from '../../setup'

describe('Database Schema', () => {
  let dbPath: string

  beforeEach(() => {
    dbPath = createTempDbPath()
    initDatabase(dbPath)
  })

  afterEach(() => {
    closeDatabase()
    cleanupTempDir(dbPath)
  })

  it('should create all expected tables', () => {
    const db = getDatabase()
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[]

    const tableNames = tables.map((t) => t.name)

    expect(tableNames).toContain('posts')
    expect(tableNames).toContain('slides')
    expect(tableNames).toContain('stories')
    expect(tableNames).toContain('post_performance')
    expect(tableNames).toContain('story_performance')
    expect(tableNames).toContain('balance_matrix')
    expect(tableNames).toContain('settings_versions')
    expect(tableNames).toContain('templates')
  })

  it('should have brand_id column with DEFAULT 1 in posts table', () => {
    const db = getDatabase()
    const tableInfo = db.prepare('PRAGMA table_info(posts)').all() as Array<{
      name: string
      type: string
      dflt_value: string | null
    }>

    const brandIdColumn = tableInfo.find((col) => col.name === 'brand_id')
    expect(brandIdColumn).toBeDefined()
    expect(brandIdColumn?.dflt_value).toBe('1')
  })

  it('should have brand_id column with DEFAULT 1 in stories table', () => {
    const db = getDatabase()
    const tableInfo = db.prepare('PRAGMA table_info(stories)').all() as Array<{
      name: string
      type: string
      dflt_value: string | null
    }>

    const brandIdColumn = tableInfo.find((col) => col.name === 'brand_id')
    expect(brandIdColumn).toBeDefined()
    expect(brandIdColumn?.dflt_value).toBe('1')
  })

  it('should have brand_id column with DEFAULT 1 in balance_matrix table', () => {
    const db = getDatabase()
    const tableInfo = db.prepare('PRAGMA table_info(balance_matrix)').all() as Array<{
      name: string
      type: string
      dflt_value: string | null
    }>

    const brandIdColumn = tableInfo.find((col) => col.name === 'brand_id')
    expect(brandIdColumn).toBeDefined()
    expect(brandIdColumn?.dflt_value).toBe('1')
  })

  it('should have brand_id column with DEFAULT 1 in templates table', () => {
    const db = getDatabase()
    const tableInfo = db.prepare('PRAGMA table_info(templates)').all() as Array<{
      name: string
      type: string
      dflt_value: string | null
    }>

    const brandIdColumn = tableInfo.find((col) => col.name === 'brand_id')
    expect(brandIdColumn).toBeDefined()
    expect(brandIdColumn?.dflt_value).toBe('1')
  })

  it('should enforce foreign key constraints', () => {
    const db = getDatabase()

    // Insert a valid post first
    const postId = db
      .prepare(
        `INSERT INTO posts (pillar, theme, mechanic, content_type)
         VALUES ('demand', 'growth', 'carousel', 'carousel')`
      )
      .run().lastInsertRowid

    // Trying to insert slide with invalid post_id should fail
    expect(() => {
      db.prepare(
        `INSERT INTO slides (post_id, slide_number, slide_type)
         VALUES (99999, 1, 'cover')`
      ).run()
    }).toThrow()

    // Valid insertion should work
    expect(() => {
      db.prepare(
        `INSERT INTO slides (post_id, slide_number, slide_type)
         VALUES (?, 1, 'cover')`
      ).run(postId)
    }).not.toThrow()
  })

  it('should have check constraints on status fields', () => {
    const db = getDatabase()

    // Invalid status should fail
    expect(() => {
      db.prepare(
        `INSERT INTO posts (pillar, theme, mechanic, content_type, status)
         VALUES ('demand', 'growth', 'carousel', 'carousel', 'invalid_status')`
      ).run()
    }).toThrow()

    // Valid status should work
    expect(() => {
      db.prepare(
        `INSERT INTO posts (pillar, theme, mechanic, content_type, status)
         VALUES ('demand', 'growth', 'carousel', 'carousel', 'draft')`
      ).run()
    }).not.toThrow()
  })
})
