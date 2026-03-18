import { describe, it, expect } from 'vitest'
import {
  recommendContent,
  calculatePillarBalance,
  generateWarnings
} from '../../../src/server/services/learning-service'
import type { BalanceEntry } from '../../../src/shared/types'

function makeEntry(
  id: number,
  type: string,
  value: string,
  usageCount: number,
  lastUsed: number | null = null,
  avgPerformance: number | null = null
): BalanceEntry {
  return { id, variable_type: type, variable_value: value, usage_count: usageCount, last_used: lastUsed, avg_performance: avgPerformance }
}

describe('recommendContent', () => {
  it('throws when entries array is empty', () => {
    expect(() => recommendContent([])).toThrow('Balance matrix is empty')
  })

  it('throws when a required dimension is missing', () => {
    const entries = [
      makeEntry(1, 'pillar', 'A', 1),
      makeEntry(2, 'theme', 'X', 1)
      // mechanic missing
    ]
    expect(() => recommendContent(entries)).toThrow('missing required dimensions')
  })

  it('uses cold_start_round_robin when no performance data', () => {
    const entries = [
      makeEntry(1, 'pillar', 'A', 5),
      makeEntry(2, 'pillar', 'B', 2),
      makeEntry(3, 'theme', 'X', 3),
      makeEntry(4, 'mechanic', 'Edu', 1)
    ]
    const result = recommendContent(entries)
    expect(result.reasoning).toBe('cold_start_round_robin')
    // Least-used pillar is B (count=2)
    expect(result.pillar).toBe('B')
  })

  it('round-robin selects alphabetically when usage counts are equal', () => {
    const entries = [
      makeEntry(1, 'pillar', 'Zebra', 2),
      makeEntry(2, 'pillar', 'Alpha', 2),
      makeEntry(3, 'theme', 'T', 1),
      makeEntry(4, 'mechanic', 'M', 1)
    ]
    const result = recommendContent(entries)
    expect(result.pillar).toBe('Alpha') // alphabetically first
  })

  it('uses performance_weighted when avg_performance data exists', () => {
    const entries = [
      makeEntry(1, 'pillar', 'High', 2, null, 100),
      makeEntry(2, 'pillar', 'Low', 2, null, 1),
      makeEntry(3, 'theme', 'T', 1, null, 50),
      makeEntry(4, 'mechanic', 'M', 1, null, 50)
    ]
    const result = recommendContent(entries)
    expect(result.reasoning).toBe('performance_weighted')
  })
})

describe('calculatePillarBalance', () => {
  it('computes actual percentages correctly', () => {
    const entries = [
      makeEntry(1, 'pillar', 'A', 4),
      makeEntry(2, 'pillar', 'B', 4),
      makeEntry(3, 'pillar', 'C', 2),
      makeEntry(4, 'mechanic', 'Edu', 3),
      makeEntry(5, 'theme', 'X', 2)
    ]
    const result = calculatePillarBalance(entries, { A: 40, B: 40, C: 20 })
    const a = result.pillars.find(p => p.name === 'A')!
    const b = result.pillars.find(p => p.name === 'B')!
    const c = result.pillars.find(p => p.name === 'C')!
    expect(a.actual_pct).toBe(40)
    expect(b.actual_pct).toBe(40)
    expect(c.actual_pct).toBe(20)
    expect(result.total_posts).toBe(10)
  })

  it('sets actual_pct to 0 when total usage count is 0', () => {
    const entries = [
      makeEntry(1, 'pillar', 'A', 0),
      makeEntry(2, 'mechanic', 'M', 0),
      makeEntry(3, 'theme', 'T', 0)
    ]
    const result = calculatePillarBalance(entries, { A: 100 })
    expect(result.pillars[0].actual_pct).toBe(0)
    expect(result.total_posts).toBe(0)
  })

  it('maps target percentages from provided object, defaults to 0 for unknown', () => {
    const entries = [
      makeEntry(1, 'pillar', 'Known', 5),
      makeEntry(2, 'pillar', 'Unknown', 5),
      makeEntry(3, 'mechanic', 'M', 1),
      makeEntry(4, 'theme', 'T', 1)
    ]
    const result = calculatePillarBalance(entries, { Known: 70 })
    const known = result.pillars.find(p => p.name === 'Known')!
    const unknown = result.pillars.find(p => p.name === 'Unknown')!
    expect(known.target_pct).toBe(70)
    expect(unknown.target_pct).toBe(0)
  })

  it('includes mechanics and themes with avg_performance values', () => {
    const entries = [
      makeEntry(1, 'pillar', 'P', 3),
      makeEntry(2, 'mechanic', 'Edu', 5, null, 42.5),
      makeEntry(3, 'theme', 'AI', 3, null, null)
    ]
    const result = calculatePillarBalance(entries, {})
    expect(result.mechanics[0].avg_performance).toBe(42.5)
    expect(result.themes[0].avg_performance).toBeNull()
  })
})

describe('generateWarnings', () => {
  it('returns empty array when no entries qualify', () => {
    const entries = [
      makeEntry(1, 'pillar', 'A', 3, null) // usage_count <= 3, skip
    ]
    expect(generateWarnings(entries)).toHaveLength(0)
  })

  it('skips entries with null last_used', () => {
    const entries = [
      makeEntry(1, 'pillar', 'A', 10, null) // no last_used
    ]
    expect(generateWarnings(entries)).toHaveLength(0)
  })

  it('flags entries used more than 3 times with recent last_used', () => {
    const recentTimestamp = Math.floor(Date.now() / 1000) - 86400 * 3 // 3 days ago
    const entries = [
      makeEntry(1, 'pillar', 'A', 5, recentTimestamp)
    ]
    const warnings = generateWarnings(entries)
    expect(warnings).toHaveLength(1)
    expect(warnings[0].variable_value).toBe('A')
    expect(warnings[0].usage_count).toBe(5)
    expect(warnings[0].message).toContain('rotate?')
  })

  it('ignores entries last used more than 14 days ago', () => {
    const oldTimestamp = Math.floor(Date.now() / 1000) - 86400 * 20 // 20 days ago
    const entries = [
      makeEntry(1, 'pillar', 'A', 10, oldTimestamp)
    ]
    expect(generateWarnings(entries)).toHaveLength(0)
  })
})
