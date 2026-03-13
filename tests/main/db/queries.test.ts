import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { initDatabase, getDatabase, closeDatabase } from '@main/db/index'
import { createTempDbPath, cleanupTempDir } from '../../setup'
import {
  insertPost,
  insertSlide,
  updatePostStatus,
  getPostWithSlides,
  updateBalanceMatrix,
  getBalanceMatrix
} from '@main/db/queries'

describe('Post and Slide Queries', () => {
  let dbPath: string

  beforeEach(() => {
    dbPath = createTempDbPath()
    initDatabase(dbPath)
  })

  afterEach(() => {
    try {
      closeDatabase()
    } catch (err) {
      // Ignore if already closed
    }
    cleanupTempDir(dbPath)
  })

  describe('insertSlide', () => {
    it('should insert slide and return slide id', () => {
      const postId = insertPost({
        pillar: 'Generate Demand',
        theme: 'Coaching',
        mechanic: 'Hook',
        content_type: 'carousel'
      })

      const slideId = insertSlide({
        post_id: postId,
        slide_number: 1,
        slide_type: 'cover',
        hook_text: 'Test hook',
        body_text: 'Test body',
        cta_text: 'Test CTA',
        overlay_opacity: 0.5
      })

      expect(slideId).toBeGreaterThan(0)

      const db = getDatabase()
      const slide = db.prepare('SELECT * FROM slides WHERE id = ?').get(slideId)
      expect(slide).toBeDefined()
      expect(slide.post_id).toBe(postId)
      expect(slide.slide_number).toBe(1)
      expect(slide.slide_type).toBe('cover')
      expect(slide.hook_text).toBe('Test hook')
    })
  })

  describe('updatePostStatus', () => {
    it('should update post status', () => {
      const postId = insertPost({
        pillar: 'Generate Demand',
        theme: 'Coaching',
        mechanic: 'Hook',
        content_type: 'single',
        status: 'draft'
      })

      updatePostStatus(postId, 'approved')

      const db = getDatabase()
      const post = db.prepare('SELECT status FROM posts WHERE id = ?').get(postId)
      expect(post.status).toBe('approved')
    })
  })

  describe('getPostWithSlides', () => {
    it('should return post with slides array', () => {
      const postId = insertPost({
        pillar: 'Generate Demand',
        theme: 'Coaching',
        mechanic: 'Hook',
        content_type: 'carousel'
      })

      insertSlide({
        post_id: postId,
        slide_number: 1,
        slide_type: 'cover',
        hook_text: 'Hook 1',
        body_text: 'Body 1',
        cta_text: 'CTA 1',
        overlay_opacity: 0.5
      })

      insertSlide({
        post_id: postId,
        slide_number: 2,
        slide_type: 'content',
        hook_text: 'Hook 2',
        body_text: 'Body 2',
        cta_text: 'CTA 2',
        overlay_opacity: 0.6
      })

      const result = getPostWithSlides(postId)

      expect(result).toBeDefined()
      expect(result.post.id).toBe(postId)
      expect(result.slides).toHaveLength(2)
      expect(result.slides[0].slide_number).toBe(1)
      expect(result.slides[0].slide_type).toBe('cover')
      expect(result.slides[1].slide_number).toBe(2)
      expect(result.slides[1].slide_type).toBe('content')
    })

    it('should return empty slides array for post without slides', () => {
      const postId = insertPost({
        pillar: 'Generate Demand',
        theme: 'Coaching',
        mechanic: 'Hook',
        content_type: 'single'
      })

      const result = getPostWithSlides(postId)

      expect(result).toBeDefined()
      expect(result.post.id).toBe(postId)
      expect(result.slides).toHaveLength(0)
    })
  })

  describe('updateBalanceMatrix', () => {
    it('should insert new entry with usage_count = 1 on first call', () => {
      updateBalanceMatrix(1, 'pillar', 'Generate Demand')

      const entries = getBalanceMatrix(1)
      const entry = entries.find(
        (e) => e.variable_type === 'pillar' && e.variable_value === 'Generate Demand'
      )

      expect(entry).toBeDefined()
      expect(entry.usage_count).toBe(1)
      expect(entry.last_used).toBeGreaterThan(0)
    })

    it('should increment usage_count on subsequent calls', () => {
      updateBalanceMatrix(1, 'theme', 'Coaching')
      updateBalanceMatrix(1, 'theme', 'Coaching')

      const entries = getBalanceMatrix(1)
      const entry = entries.find(
        (e) => e.variable_type === 'theme' && e.variable_value === 'Coaching'
      )

      expect(entry).toBeDefined()
      expect(entry.usage_count).toBe(2)
    })

    it('should update last_used timestamp on each call', async () => {
      updateBalanceMatrix(1, 'mechanic', 'Hook')

      const beforeTimestamp = Math.floor(Date.now() / 1000)

      // Wait 1 second to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1100))

      updateBalanceMatrix(1, 'mechanic', 'Hook')

      const entries = getBalanceMatrix(1)
      const entry = entries.find(
        (e) => e.variable_type === 'mechanic' && e.variable_value === 'Hook'
      )

      expect(entry).toBeDefined()
      expect(entry.last_used).toBeGreaterThan(beforeTimestamp)
    })
  })

  describe('getBalanceMatrix ad-hoc filtering', () => {
    it('should return all entries including those from ad_hoc posts', () => {
      // Regular post
      const postId1 = insertPost({
        pillar: 'Generate Demand',
        theme: 'Coaching',
        mechanic: 'Hook',
        content_type: 'single',
        ad_hoc: 0
      })

      // Ad-hoc post
      const postId2 = insertPost({
        pillar: 'Build Trust',
        theme: 'Personal Story',
        mechanic: 'Story',
        content_type: 'single',
        ad_hoc: 1
      })

      updateBalanceMatrix(1, 'theme', 'Coaching')
      updateBalanceMatrix(1, 'theme', 'Personal Story')

      const entries = getBalanceMatrix(1)

      // Both themes should be present in balance matrix
      expect(entries.length).toBeGreaterThanOrEqual(2)

      const coachingEntry = entries.find(
        (e) => e.variable_type === 'theme' && e.variable_value === 'Coaching'
      )
      const personalStoryEntry = entries.find(
        (e) => e.variable_type === 'theme' && e.variable_value === 'Personal Story'
      )

      expect(coachingEntry).toBeDefined()
      expect(personalStoryEntry).toBeDefined()
    })
  })
})
