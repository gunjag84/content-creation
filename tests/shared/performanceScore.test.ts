import { describe, it, expect } from 'vitest'
import { computePerformanceScore } from '../../src/shared/performanceScore'

describe('computePerformanceScore', () => {
  it('returns 0 when all values are null/zero', () => {
    expect(computePerformanceScore({ reach: null, likes: null, comments: null, shares: null, saves: null })).toBe(0)
    expect(computePerformanceScore({ reach: 0, likes: 0, comments: 0, shares: 0, saves: 0 })).toBe(0)
    expect(computePerformanceScore({})).toBe(0)
  })

  it('returns weighted sum for mixed values', () => {
    const score = computePerformanceScore({
      reach: 100,
      likes: 10,
      comments: 5,
      shares: 3,
      saves: 8
    })
    // 100 + 10*2 + 5*3 + 3*4 + 8*3 = 100 + 20 + 15 + 12 + 24 = 171
    expect(score).toBe(171)
  })
})
