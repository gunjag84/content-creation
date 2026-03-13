import type { BalanceEntry } from '../db/queries'
import type { BalanceDashboardData } from '../../shared/types/generation'

/**
 * Calculate actual vs target pillar distribution and aggregate mechanics/themes.
 *
 * @param entries - All balance matrix entries for a brand
 * @param targetPercentages - Map of pillar name to target percentage (from settings.content_pillars)
 */
export function calculatePillarBalance(
  entries: BalanceEntry[],
  targetPercentages: Record<string, number>
): BalanceDashboardData {
  const pillars: Array<{ name: string; actual_pct: number; target_pct: number; count: number }> = []
  const mechanics: Array<{ name: string; count: number }> = []
  const themes: Array<{ name: string; count: number }> = []

  // Group entries by variable type
  const pillarEntries = entries.filter((e) => e.variable_type === 'pillar')
  const mechanicEntries = entries.filter((e) => e.variable_type === 'mechanic')
  const themeEntries = entries.filter((e) => e.variable_type === 'theme')

  // Calculate total pillar usage count
  const totalPillarCount = pillarEntries.reduce((sum, e) => sum + e.usage_count, 0)

  // Build pillar data with actual vs target percentages
  for (const entry of pillarEntries) {
    const actualPct = totalPillarCount > 0 ? (entry.usage_count / totalPillarCount) * 100 : 0
    const targetPct = targetPercentages[entry.variable_value] ?? 0

    pillars.push({
      name: entry.variable_value,
      actual_pct: Math.round(actualPct),
      target_pct: targetPct,
      count: entry.usage_count
    })
  }

  // Build mechanics data
  for (const entry of mechanicEntries) {
    mechanics.push({
      name: entry.variable_value,
      count: entry.usage_count
    })
  }

  // Build themes data
  for (const entry of themeEntries) {
    themes.push({
      name: entry.variable_value,
      count: entry.usage_count
    })
  }

  return {
    pillars,
    mechanics,
    themes,
    total_posts: totalPillarCount
  }
}
