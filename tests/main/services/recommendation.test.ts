import { describe, it, expect } from 'vitest'
import { recommendContent } from '../../../src/main/services/recommendation'
import { BalanceEntry } from '../../../src/main/db/queries'

describe('recommendContent', () => {
  describe('cold start (round-robin)', () => {
    it('should pick entry with lowest usage_count', () => {
      const entries: BalanceEntry[] = [
        { id: 1, brand_id: 1, variable_type: 'pillar', variable_value: 'Generate Demand', usage_count: 5, last_used: null, avg_performance: null },
        { id: 2, brand_id: 1, variable_type: 'pillar', variable_value: 'Convert Demand', usage_count: 3, last_used: null, avg_performance: null },
        { id: 3, brand_id: 1, variable_type: 'pillar', variable_value: 'Nurture Loyalty', usage_count: 8, last_used: null, avg_performance: null },
        { id: 4, brand_id: 1, variable_type: 'theme', variable_value: 'Coaching', usage_count: 2, last_used: null, avg_performance: null },
        { id: 5, brand_id: 1, variable_type: 'theme', variable_value: 'Sales', usage_count: 1, last_used: null, avg_performance: null },
        { id: 6, brand_id: 1, variable_type: 'mechanic', variable_value: 'Hook', usage_count: 4, last_used: null, avg_performance: null },
        { id: 7, brand_id: 1, variable_type: 'mechanic', variable_value: 'List', usage_count: 2, last_used: null, avg_performance: null }
      ]

      const result = recommendContent(1, entries)

      expect(result.pillar).toBe('Convert Demand')
      expect(result.theme).toBe('Sales')
      expect(result.mechanic).toBe('List')
      expect(result.reasoning).toBe('cold_start_round_robin')
    })

    it('should break ties alphabetically when usage_count is equal', () => {
      const entries: BalanceEntry[] = [
        { id: 1, brand_id: 1, variable_type: 'pillar', variable_value: 'Zebra', usage_count: 3, last_used: null, avg_performance: null },
        { id: 2, brand_id: 1, variable_type: 'pillar', variable_value: 'Apple', usage_count: 3, last_used: null, avg_performance: null },
        { id: 3, brand_id: 1, variable_type: 'pillar', variable_value: 'Banana', usage_count: 3, last_used: null, avg_performance: null },
        { id: 4, brand_id: 1, variable_type: 'theme', variable_value: 'Coaching', usage_count: 5, last_used: null, avg_performance: null },
        { id: 5, brand_id: 1, variable_type: 'mechanic', variable_value: 'Hook', usage_count: 2, last_used: null, avg_performance: null }
      ]

      const result = recommendContent(1, entries)

      expect(result.pillar).toBe('Apple')
      expect(result.reasoning).toBe('cold_start_round_robin')
    })

    it('should handle single entry per variable_type', () => {
      const entries: BalanceEntry[] = [
        { id: 1, brand_id: 1, variable_type: 'pillar', variable_value: 'Generate Demand', usage_count: 10, last_used: null, avg_performance: null },
        { id: 2, brand_id: 1, variable_type: 'theme', variable_value: 'Coaching', usage_count: 5, last_used: null, avg_performance: null },
        { id: 3, brand_id: 1, variable_type: 'mechanic', variable_value: 'Hook', usage_count: 3, last_used: null, avg_performance: null }
      ]

      const result = recommendContent(1, entries)

      expect(result.pillar).toBe('Generate Demand')
      expect(result.theme).toBe('Coaching')
      expect(result.mechanic).toBe('Hook')
      expect(result.reasoning).toBe('cold_start_round_robin')
    })
  })

  describe('warm start (performance-weighted)', () => {
    it('should use performance-weighted selection when avg_performance exists', () => {
      const entries: BalanceEntry[] = [
        { id: 1, brand_id: 1, variable_type: 'pillar', variable_value: 'Low', usage_count: 5, last_used: 123, avg_performance: 10 },
        { id: 2, brand_id: 1, variable_type: 'pillar', variable_value: 'Medium', usage_count: 3, last_used: 456, avg_performance: 30 },
        { id: 3, brand_id: 1, variable_type: 'pillar', variable_value: 'High', usage_count: 8, last_used: 789, avg_performance: 60 },
        { id: 4, brand_id: 1, variable_type: 'theme', variable_value: 'Theme1', usage_count: 2, last_used: 100, avg_performance: 50 },
        { id: 5, brand_id: 1, variable_type: 'mechanic', variable_value: 'Mechanic1', usage_count: 4, last_used: 200, avg_performance: 80 }
      ]

      // Run many iterations to verify weighted distribution
      const counts = { Low: 0, Medium: 0, High: 0 }
      for (let i = 0; i < 1000; i++) {
        const result = recommendContent(1, entries)
        counts[result.pillar as keyof typeof counts]++
        expect(result.reasoning).toBe('performance_weighted')
      }

      // Verify High (60%) gets picked most often
      expect(counts.High).toBeGreaterThan(counts.Medium)
      expect(counts.Medium).toBeGreaterThan(counts.Low)

      // Roughly 60% for High, 30% for Medium, 10% for Low
      // Allow 10% variance to avoid flaky tests
      expect(counts.High).toBeGreaterThan(500)
      expect(counts.Medium).toBeGreaterThan(200)
      expect(counts.Low).toBeGreaterThan(50)
    })

    it('should fall back to round-robin for dimensions without performance data', () => {
      const entries: BalanceEntry[] = [
        // Pillar has performance data
        { id: 1, brand_id: 1, variable_type: 'pillar', variable_value: 'With Performance', usage_count: 5, last_used: 123, avg_performance: 50 },
        // Theme has no performance data (cold start)
        { id: 2, brand_id: 1, variable_type: 'theme', variable_value: 'Theme A', usage_count: 3, last_used: null, avg_performance: null },
        { id: 3, brand_id: 1, variable_type: 'theme', variable_value: 'Theme B', usage_count: 5, last_used: null, avg_performance: null },
        // Mechanic has performance data
        { id: 4, brand_id: 1, variable_type: 'mechanic', variable_value: 'With Performance', usage_count: 4, last_used: 200, avg_performance: 70 }
      ]

      const result = recommendContent(1, entries)

      // Theme should use round-robin (lowest usage_count)
      expect(result.theme).toBe('Theme A')
      expect(result.reasoning).toBe('performance_weighted')
    })

    it('should normalize weights and handle edge cases', () => {
      const entries: BalanceEntry[] = [
        { id: 1, brand_id: 1, variable_type: 'pillar', variable_value: 'Zero', usage_count: 5, last_used: 123, avg_performance: 0 },
        { id: 2, brand_id: 1, variable_type: 'pillar', variable_value: 'Positive', usage_count: 3, last_used: 456, avg_performance: 100 },
        { id: 3, brand_id: 1, variable_type: 'theme', variable_value: 'Theme1', usage_count: 2, last_used: 100, avg_performance: 50 },
        { id: 4, brand_id: 1, variable_type: 'mechanic', variable_value: 'Mechanic1', usage_count: 4, last_used: 200, avg_performance: 80 }
      ]

      // Zero performance should still have a chance (fallback or minimal weight)
      const result = recommendContent(1, entries)
      expect(result.reasoning).toBe('performance_weighted')
      expect(['Zero', 'Positive']).toContain(result.pillar)
    })
  })

  describe('edge cases', () => {
    it('should throw error when no entries for required variable_type', () => {
      const entries: BalanceEntry[] = [
        { id: 1, brand_id: 1, variable_type: 'pillar', variable_value: 'Generate Demand', usage_count: 5, last_used: null, avg_performance: null }
        // Missing theme and mechanic
      ]

      expect(() => recommendContent(1, entries)).toThrow()
    })

    it('should handle empty entries array', () => {
      expect(() => recommendContent(1, [])).toThrow()
    })
  })
})
