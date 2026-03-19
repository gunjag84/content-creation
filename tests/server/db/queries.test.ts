import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { initDatabase, closeDatabase } from '../../../src/server/db/index'
import {
  insertPost,
  getPost,
  listPosts,
  updatePostStatus,
  insertSlide,
  getSlidesByPost,
  upsertPerformance,
  getPerformance,
  updateBalanceMatrix,
  getBalanceMatrix
} from '../../../src/server/db/queries'

beforeEach(() => {
  initDatabase(':memory:')
})

afterEach(() => {
  closeDatabase()
})

describe('posts', () => {
  it('insertPost + getPost round-trip returns correct data', () => {
    const id = insertPost({ pillar: 'Growth', area: 'L3 Alltagschaos', method: 'M1 Provokante These', tonality: 'T1 Emotional', content_type: 'carousel', caption: 'Hello world' })
    expect(id).toBeGreaterThan(0)

    const post = getPost(id)
    expect(post).toBeDefined()
    expect(post!.pillar).toBe('Growth')
    expect(post!.area).toBe('L3 Alltagschaos')
    expect(post!.approach).toBeNull()
    expect(post!.method).toBe('M1 Provokante These')
    expect(post!.tonality).toBe('T1 Emotional')
    expect(post!.content_type).toBe('carousel')
    expect(post!.caption).toBe('Hello world')
    expect(post!.status).toBe('draft')
  })

  it('insertPost with approach stores approach', () => {
    const id = insertPost({ pillar: 'A', area: 'L1', approach: 'A1 Dankbarkeit', method: 'M1', tonality: 'T1', content_type: 'single' })
    const post = getPost(id)
    expect(post!.approach).toBe('A1 Dankbarkeit')
  })

  it('listPosts returns all inserted posts', () => {
    insertPost({ pillar: 'A', area: 'L1', method: 'M1', tonality: 'T1', content_type: 'single' })
    insertPost({ pillar: 'B', area: 'L2', method: 'M2', tonality: 'T2', content_type: 'single' })
    const posts = listPosts()
    expect(posts.length).toBe(2)
  })

  it('updatePostStatus changes status from draft to approved', () => {
    const id = insertPost({ pillar: 'P', area: 'L1', method: 'M1', tonality: 'T1', content_type: 'single' })
    updatePostStatus(id, 'approved')
    const post = getPost(id)
    expect(post!.status).toBe('approved')
  })
})

describe('slides', () => {
  it('insertSlide + getSlidesByPost returns slides ordered by slide_number', () => {
    const postId = insertPost({ pillar: 'P', area: 'L1', method: 'M1', tonality: 'T1', content_type: 'carousel' })
    insertSlide({ post_id: postId, slide_number: 2, slide_type: 'content', body_text: 'Body 2' })
    insertSlide({ post_id: postId, slide_number: 1, slide_type: 'cover', hook_text: 'Hook 1' })

    const slides = getSlidesByPost(postId)
    expect(slides).toHaveLength(2)
    expect(slides[0].slide_number).toBe(1)
    expect(slides[0].hook_text).toBe('Hook 1')
    expect(slides[1].slide_number).toBe(2)
    expect(slides[1].body_text).toBe('Body 2')
  })
})

describe('performance', () => {
  it('upsertPerformance + getPerformance round-trip', () => {
    const postId = insertPost({ pillar: 'P', area: 'L1', method: 'M1', tonality: 'T1', content_type: 'single' })
    upsertPerformance(postId, { reach: 1500, likes: 80, comments: 12 })

    const perf = getPerformance(postId)
    expect(perf).toBeDefined()
    expect(perf!.reach).toBe(1500)
    expect(perf!.likes).toBe(80)
    expect(perf!.comments).toBe(12)
  })

  it('upsertPerformance updates on conflict (same post_id)', () => {
    const postId = insertPost({ pillar: 'P', area: 'L1', method: 'M1', tonality: 'T1', content_type: 'single' })
    upsertPerformance(postId, { reach: 500 })
    upsertPerformance(postId, { reach: 999, saves: 40 })

    const perf = getPerformance(postId)
    expect(perf!.reach).toBe(999)
    expect(perf!.saves).toBe(40)
  })
})

describe('balance matrix', () => {
  it('updateBalanceMatrix inserts with usage_count=1 on first call', () => {
    updateBalanceMatrix('area', 'L1')
    const entries = getBalanceMatrix()
    const entry = entries.find(e => e.variable_type === 'area' && e.variable_value === 'L1')
    expect(entry).toBeDefined()
    expect(entry!.usage_count).toBe(1)
  })

  it('updateBalanceMatrix increments usage_count on subsequent calls', () => {
    updateBalanceMatrix('method', 'M1')
    updateBalanceMatrix('method', 'M1')
    updateBalanceMatrix('method', 'M1')
    const entries = getBalanceMatrix()
    const entry = entries.find(e => e.variable_value === 'M1')!
    expect(entry.usage_count).toBe(3)
  })

  it('getBalanceMatrix returns all tracked entries', () => {
    updateBalanceMatrix('pillar', 'A')
    updateBalanceMatrix('area', 'L1')
    updateBalanceMatrix('method', 'M1')
    updateBalanceMatrix('tonality', 'T1')
    const entries = getBalanceMatrix()
    expect(entries.length).toBe(4)
  })
})
