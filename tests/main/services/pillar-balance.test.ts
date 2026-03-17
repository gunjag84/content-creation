import { describe, it, expect } from 'vitest'
import { calculatePillarBalance } from '@main/services/pillar-balance'
import type { BalanceEntry } from '@main/db/queries'

describe('Pillar Balance', () => {
  describe('calculatePillarBalance', () => {
    it('should calculate actual percentages correctly', () => {
      const entries: BalanceEntry[] = [
        {
          id: 1,
          brand_id: 1,
          variable_type: 'pillar',
          variable_value: 'Generate Demand',
          usage_count: 30,
          last_used: null,
          avg_performance: null
        },
        {
          id: 2,
          brand_id: 1,
          variable_type: 'pillar',
          variable_value: 'Build Trust',
          usage_count: 70,
          last_used: null,
          avg_performance: null
        }
      ]

      const targetPercentages = {
        'Generate Demand': 50,
        'Build Trust': 50
      }

      const result = calculatePillarBalance(entries, targetPercentages)

      expect(result.total_posts).toBe(100)
      expect(result.pillars).toHaveLength(2)

      const generateDemand = result.pillars.find((p) => p.name === 'Generate Demand')
      const buildTrust = result.pillars.find((p) => p.name === 'Build Trust')

      expect(generateDemand).toBeDefined()
      expect(generateDemand.actual_pct).toBe(30)
      expect(generateDemand.target_pct).toBe(50)
      expect(generateDemand.count).toBe(30)

      expect(buildTrust).toBeDefined()
      expect(buildTrust.actual_pct).toBe(70)
      expect(buildTrust.target_pct).toBe(50)
      expect(buildTrust.count).toBe(70)
    })

    it('should group mechanics and themes by usage count', () => {
      const entries: BalanceEntry[] = [
        {
          id: 3,
          brand_id: 1,
          variable_type: 'mechanic',
          variable_value: 'Hook',
          usage_count: 15,
          last_used: null,
          avg_performance: null
        },
        {
          id: 4,
          brand_id: 1,
          variable_type: 'mechanic',
          variable_value: 'Story',
          usage_count: 10,
          last_used: null,
          avg_performance: null
        },
        {
          id: 5,
          brand_id: 1,
          variable_type: 'theme',
          variable_value: 'Coaching',
          usage_count: 8,
          last_used: null,
          avg_performance: null
        },
        {
          id: 6,
          brand_id: 1,
          variable_type: 'theme',
          variable_value: 'Personal Story',
          usage_count: 12,
          last_used: null,
          avg_performance: null
        }
      ]

      const result = calculatePillarBalance(entries, {})

      expect(result.mechanics).toHaveLength(2)
      expect(result.themes).toHaveLength(2)

      const hookMechanic = result.mechanics.find((m) => m.name === 'Hook')
      const storyMechanic = result.mechanics.find((m) => m.name === 'Story')

      expect(hookMechanic?.count).toBe(15)
      expect(storyMechanic?.count).toBe(10)

      const coachingTheme = result.themes.find((t) => t.name === 'Coaching')
      const personalStoryTheme = result.themes.find((t) => t.name === 'Personal Story')

      expect(coachingTheme?.count).toBe(8)
      expect(personalStoryTheme?.count).toBe(12)
    })

    it('should handle empty entries array', () => {
      const result = calculatePillarBalance([], {})

      expect(result.total_posts).toBe(0)
      expect(result.pillars).toHaveLength(0)
      expect(result.mechanics).toHaveLength(0)
      expect(result.themes).toHaveLength(0)
    })

    it('should pass through avg_performance from BalanceEntry to mechanics and themes', () => {
      const entries: BalanceEntry[] = [
        { id: 3, brand_id: 1, variable_type: 'mechanic', variable_value: 'Hook', usage_count: 15, last_used: null, avg_performance: 7.5 },
        { id: 4, brand_id: 1, variable_type: 'mechanic', variable_value: 'Story', usage_count: 10, last_used: null, avg_performance: null },
        { id: 5, brand_id: 1, variable_type: 'theme', variable_value: 'Coaching', usage_count: 8, last_used: null, avg_performance: 4.2 },
        { id: 6, brand_id: 1, variable_type: 'theme', variable_value: 'Personal Story', usage_count: 12, last_used: null, avg_performance: null }
      ]
      const result = calculatePillarBalance(entries, {})
      const hookMechanic = result.mechanics.find(m => m.name === 'Hook')
      const storyMechanic = result.mechanics.find(m => m.name === 'Story')
      expect(hookMechanic?.avg_performance).toBe(7.5)
      expect(storyMechanic?.avg_performance).toBeNull()
      const coachingTheme = result.themes.find(t => t.name === 'Coaching')
      const personalStoryTheme = result.themes.find(t => t.name === 'Personal Story')
      expect(coachingTheme?.avg_performance).toBe(4.2)
      expect(personalStoryTheme?.avg_performance).toBeNull()
    })

    it('should set target_pct to 0 for pillars not in targetPercentages', () => {
      const entries: BalanceEntry[] = [
        {
          id: 1,
          brand_id: 1,
          variable_type: 'pillar',
          variable_value: 'Generate Demand',
          usage_count: 50,
          last_used: null,
          avg_performance: null
        },
        {
          id: 2,
          brand_id: 1,
          variable_type: 'pillar',
          variable_value: 'Unlisted Pillar',
          usage_count: 50,
          last_used: null,
          avg_performance: null
        }
      ]

      const targetPercentages = {
        'Generate Demand': 60
      }

      const result = calculatePillarBalance(entries, targetPercentages)

      const generateDemand = result.pillars.find((p) => p.name === 'Generate Demand')
      const unlisted = result.pillars.find((p) => p.name === 'Unlisted Pillar')

      expect(generateDemand?.target_pct).toBe(60)
      expect(unlisted?.target_pct).toBe(0)
    })
  })
})
