import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { initDatabase, getDatabase, closeDatabase } from '@main/db/index'
import { createTempDbPath, cleanupTempDir } from '../../setup'
import Database from 'better-sqlite3'

describe('Database Initialization', () => {
  let dbPath: string

  beforeEach(() => {
    dbPath = createTempDbPath()
  })

  afterEach(() => {
    try {
      closeDatabase()
    } catch (err) {
      // Ignore if already closed
    }
    cleanupTempDir(dbPath)
  })

  it('should create database file and return Database instance', () => {
    const db = initDatabase(dbPath)
    expect(db).toBeDefined()
    expect(db).toBeInstanceOf(Database)
  })

  it('should enable WAL journal mode', () => {
    initDatabase(dbPath)
    const db = getDatabase()
    const result = db.prepare('PRAGMA journal_mode').get() as { journal_mode: string }
    expect(result.journal_mode).toBe('wal')
  })

  it('should enable foreign keys pragma', () => {
    initDatabase(dbPath)
    const db = getDatabase()
    const result = db.prepare('PRAGMA foreign_keys').get() as { foreign_keys: number }
    expect(result.foreign_keys).toBe(1)
  })

  it('should pass integrity check on valid database', () => {
    initDatabase(dbPath)
    const db = getDatabase()
    const result = db.prepare('PRAGMA quick_check').get() as { quick_check: string }
    expect(result.quick_check).toBe('ok')
  })

  it('should throw error when getDatabase called before init', () => {
    expect(() => getDatabase()).toThrow('Database not initialized')
  })

  it('should close database and run WAL checkpoint', () => {
    initDatabase(dbPath)
    expect(() => closeDatabase()).not.toThrow()
    // After close, getDatabase should throw
    expect(() => getDatabase()).toThrow('Database not initialized')
  })
})
