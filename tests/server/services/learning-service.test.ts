import { describe, it, expect } from 'vitest'
import {
  recommendContent,
  calculateBalance,
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
      makeEntry(2, 'scenario', 'S1', 1)
      // method missing
    ]
    expect(() => recommendContent(entries)).toThrow('missing required dimension')
  })

  it('uses cold_start_round_robin when no performance data', () => {
    const entries = [
      makeEntry(1, 'pillar', 'A', 5),
      makeEntry(2, 'pillar', 'B', 2),
      makeEntry(3, 'scenario', 'S1', 3),
      makeEntry(4, 'method', 'M1', 1)
    ]
    const result = recommendContent(entries)
    expect(result.reasoning).toBe('cold_start_round_robin')
    expect(result.pillar).toBe('B') // least-used
  })

  it('round-robin selects alphabetically when usage counts are equal', () => {
    const entries = [
      makeEntry(1, 'pillar', 'Zebra', 2),
      makeEntry(2, 'pillar', 'Alpha', 2),
      makeEntry(3, 'scenario', 'S1', 1),
      makeEntry(4, 'method', 'M1', 1)
    ]
    const result = recommendContent(entries)
    expect(result.pillar).toBe('Alpha')
  })

  it('uses performance_weighted when avg_performance data exists', () => {
    const entries = [
      makeEntry(1, 'pillar', 'High', 2, null, 100),
      makeEntry(2, 'pillar', 'Low', 2, null, 1),
      makeEntry(3, 'scenario', 'S1', 1, null, 50),
      makeEntry(4, 'method', 'M1', 1, null, 50)
    ]
    const result = recommendContent(entries)
    expect(result.reasoning).toBe('performance_weighted')
  })

  it('returns scenario from recommendation', () => {
    const entries = [
      makeEntry(1, 'pillar', 'A', 1),
      makeEntry(2, 'scenario', 'S1', 1),
      makeEntry(3, 'method', 'M1', 1)
    ]
    const result = recommendContent(entries)
    expect(result.scenario).toBe('S1')
  })

  it('returns method from recommendation', () => {
    const entries = [
      makeEntry(1, 'pillar', 'A', 1),
      makeEntry(2, 'scenario', 'S1', 1),
      makeEntry(3, 'method', 'M1', 1)
    ]
    const result = recommendContent(entries)
    expect(result.method).toBe('M1')
  })
})

describe('calculateBalance', () => {
  it('computes actual percentages correctly', () => {
    const entries = [
      makeEntry(1, 'pillar', 'A', 4),
      makeEntry(2, 'pillar', 'B', 4),
      makeEntry(3, 'pillar', 'C', 2),
      makeEntry(4, 'scenario', 'S1', 3),
      makeEntry(5, 'method', 'M1', 2)
    ]
    const result = calculateBalance(entries, { A: 40, B: 40, C: 20 })
    const a = result.pillars.find(p => p.name === 'A')!
    expect(a.actual_pct).toBe(40)
    expect(result.total_posts).toBe(10)
  })

  it('sets actual_pct to 0 when total usage count is 0', () => {
    const entries = [
      makeEntry(1, 'pillar', 'A', 0),
      makeEntry(2, 'scenario', 'S1', 0)
    ]
    const result = calculateBalance(entries, { A: 100 })
    expect(result.pillars[0].actual_pct).toBe(0)
    expect(result.total_posts).toBe(0)
  })

  it('maps target percentages, defaults to 0 for unknown', () => {
    const entries = [
      makeEntry(1, 'pillar', 'Known', 5),
      makeEntry(2, 'pillar', 'Unknown', 5)
    ]
    const result = calculateBalance(entries, { Known: 70 })
    const known = result.pillars.find(p => p.name === 'Known')!
    const unknown = result.pillars.find(p => p.name === 'Unknown')!
    expect(known.target_pct).toBe(70)
    expect(unknown.target_pct).toBe(0)
  })

  it('includes scenarios and methods with avg_performance', () => {
    const entries = [
      makeEntry(1, 'pillar', 'P', 3),
      makeEntry(2, 'scenario', 'S1', 3, null, 42.5),
      makeEntry(3, 'method', 'M1', 2, null, null)
    ]
    const result = calculateBalance(entries, {})
    expect(result.scenarios[0].avg_performance).toBe(42.5)
    expect(result.methods[0].avg_performance).toBeNull()
  })

  it('returns scenarios array in result', () => {
    const entries = [
      makeEntry(1, 'pillar', 'P', 2),
      makeEntry(2, 'scenario', 'Burnout recovery', 4, null, 80),
      makeEntry(3, 'method', 'M1', 1)
    ]
    const result = calculateBalance(entries, {})
    expect(result.scenarios).toHaveLength(1)
    expect(result.scenarios[0].name).toBe('Burnout recovery')
    expect(result.scenarios[0].count).toBe(4)
  })
})

describe('generateWarnings', () => {
  it('returns empty array when no entries qualify', () => {
    const entries = [
      makeEntry(1, 'pillar', 'A', 3, null)
    ]
    expect(generateWarnings(entries)).toHaveLength(0)
  })

  it('skips entries with null last_used', () => {
    const entries = [
      makeEntry(1, 'scenario', 'S1', 10, null)
    ]
    expect(generateWarnings(entries)).toHaveLength(0)
  })

  it('flags entries used more than 3 times with recent last_used', () => {
    const recentTimestamp = Math.floor(Date.now() / 1000) - 86400 * 3
    const entries = [
      makeEntry(1, 'method', 'M1', 5, recentTimestamp)
    ]
    const warnings = generateWarnings(entries)
    expect(warnings).toHaveLength(1)
    expect(warnings[0].variable_type).toBe('method')
    expect(warnings[0].message).toContain('rotate?')
  })

  it('ignores entries last used more than 14 days ago', () => {
    const oldTimestamp = Math.floor(Date.now() / 1000) - 86400 * 20
    const entries = [
      makeEntry(1, 'scenario', 'S1', 10, oldTimestamp)
    ]
    expect(generateWarnings(entries)).toHaveLength(0)
  })

  it('flags scenario entries when recently overused', () => {
    const recentTimestamp = Math.floor(Date.now() / 1000) - 86400 * 5
    const entries = [
      makeEntry(1, 'scenario', 'Burnout recovery', 8, recentTimestamp)
    ]
    const warnings = generateWarnings(entries)
    expect(warnings).toHaveLength(1)
    expect(warnings[0].variable_type).toBe('scenario')
  })
})
