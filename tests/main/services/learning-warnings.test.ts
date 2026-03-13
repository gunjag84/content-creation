import { describe, it, expect } from 'vitest'
import { generateWarnings } from '@main/services/learning-warnings'
import type { BalanceEntry } from '@main/db/queries'

describe('Learning Warnings', () => {
  describe('generateWarnings', () => {
    it('should generate warning when usage_count > 3 and last_used within 14 days', () => {
      const now = Math.floor(Date.now() / 1000)
      const tenDaysAgo = now - 10 * 24 * 60 * 60

      const entries: BalanceEntry[] = [
        {
          id: 1,
          brand_id: 1,
          variable_type: 'mechanic',
          variable_value: 'Hook',
          usage_count: 4,
          last_used: tenDaysAgo,
          avg_performance: null
        }
      ]

      const warnings = generateWarnings(entries)

      expect(warnings).toHaveLength(1)
      expect(warnings[0].variable_type).toBe('mechanic')
      expect(warnings[0].variable_value).toBe('Hook')
      expect(warnings[0].usage_count).toBe(4)
      expect(warnings[0].days_span).toBe(10)
      expect(warnings[0].message).toContain('Hook')
      expect(warnings[0].message).toContain('4')
      expect(warnings[0].message).toContain('rotate')
    })

    it('should not generate warning when usage_count <= 3', () => {
      const now = Math.floor(Date.now() / 1000)
      const fiveDaysAgo = now - 5 * 24 * 60 * 60

      const entries: BalanceEntry[] = [
        {
          id: 1,
          brand_id: 1,
          variable_type: 'theme',
          variable_value: 'Coaching',
          usage_count: 3,
          last_used: fiveDaysAgo,
          avg_performance: null
        }
      ]

      const warnings = generateWarnings(entries)

      expect(warnings).toHaveLength(0)
    })

    it('should not generate warning when last_used is older than 14 days', () => {
      const now = Math.floor(Date.now() / 1000)
      const twentyDaysAgo = now - 20 * 24 * 60 * 60

      const entries: BalanceEntry[] = [
        {
          id: 1,
          brand_id: 1,
          variable_type: 'mechanic',
          variable_value: 'Hook',
          usage_count: 5,
          last_used: twentyDaysAgo,
          avg_performance: null
        }
      ]

      const warnings = generateWarnings(entries)

      expect(warnings).toHaveLength(0)
    })

    it('should not generate warning when last_used is null', () => {
      const entries: BalanceEntry[] = [
        {
          id: 1,
          brand_id: 1,
          variable_type: 'theme',
          variable_value: 'Coaching',
          usage_count: 5,
          last_used: null,
          avg_performance: null
        }
      ]

      const warnings = generateWarnings(entries)

      expect(warnings).toHaveLength(0)
    })

    it('should generate multiple warnings for different variables', () => {
      const now = Math.floor(Date.now() / 1000)
      const sevenDaysAgo = now - 7 * 24 * 60 * 60
      const fiveDaysAgo = now - 5 * 24 * 60 * 60

      const entries: BalanceEntry[] = [
        {
          id: 1,
          brand_id: 1,
          variable_type: 'mechanic',
          variable_value: 'Hook',
          usage_count: 4,
          last_used: sevenDaysAgo,
          avg_performance: null
        },
        {
          id: 2,
          brand_id: 1,
          variable_type: 'theme',
          variable_value: 'Coaching',
          usage_count: 5,
          last_used: fiveDaysAgo,
          avg_performance: null
        }
      ]

      const warnings = generateWarnings(entries)

      expect(warnings).toHaveLength(2)
      expect(warnings[0].variable_value).toBe('Hook')
      expect(warnings[1].variable_value).toBe('Coaching')
    })
  })
})
