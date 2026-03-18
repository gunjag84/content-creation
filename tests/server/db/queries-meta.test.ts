import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { initDatabase, closeDatabase, getDatabase } from '../../../src/server/db/index'
import { saveMetaToken, getMetaToken, deleteMetaToken, upsertPerformance, getPerformance } from '../../../src/server/db/queries'
import { createTempDbPath, cleanupTempDir } from '../../setup'

let dbPath: string

beforeEach(() => {
  dbPath = createTempDbPath()
  initDatabase(dbPath)
})

afterEach(() => {
  closeDatabase()
  cleanupTempDir(dbPath)
})

describe('meta token operations', () => {
  it('saves and retrieves a token', () => {
    saveMetaToken({
      access_token: 'test_token_123',
      ig_user_id: 'user_456',
      ig_username: 'testuser',
      expires_at: 9999999999
    })

    const token = getMetaToken()
    expect(token).toBeDefined()
    expect(token!.access_token).toBe('test_token_123')
    expect(token!.ig_username).toBe('testuser')
  })

  it('upserts (replaces) token on second save', () => {
    saveMetaToken({
      access_token: 'first',
      ig_user_id: 'u1',
      ig_username: 'first_user',
      expires_at: 1000
    })

    saveMetaToken({
      access_token: 'second',
      ig_user_id: 'u2',
      ig_username: 'second_user',
      expires_at: 2000
    })

    const token = getMetaToken()
    expect(token!.access_token).toBe('second')
    expect(token!.ig_username).toBe('second_user')
  })

  it('deletes token', () => {
    saveMetaToken({
      access_token: 'to_delete',
      ig_user_id: 'u1',
      ig_username: 'user',
      expires_at: 1000
    })

    deleteMetaToken()
    expect(getMetaToken()).toBeUndefined()
  })
})

describe('upsertPerformance with performance_score', () => {
  it('auto-computes performance_score on insert', () => {
    const db = getDatabase()
    db.prepare("INSERT INTO posts (pillar, theme, mechanic, content_type) VALUES ('P', 'T', 'M', 'carousel')").run()

    upsertPerformance(1, {
      reach: 100,
      likes: 10,
      comments: 5,
      shares: 3,
      saves: 8
    })

    const perf = getPerformance(1)
    expect(perf).toBeDefined()
    // 100 + 10*2 + 5*3 + 3*4 + 8*3 = 171
    expect(perf!.performance_score).toBe(171)
    expect(perf!.source).toBe('manual')
  })
})
