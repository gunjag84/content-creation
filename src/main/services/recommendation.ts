import type { BalanceEntry } from '../db/queries'
import type { BalanceRecommendation } from '@shared/types/generation'

/**
 * Recommends content (pillar, theme, mechanic) based on balance matrix.
 *
 * Cold start (no avg_performance): round-robin by usage_count (lowest wins, alphabetical ties)
 * Warm start (has avg_performance): weighted random selection proportional to performance
 *
 * @param brandId Brand identifier (defaults to 1)
 * @param balanceEntries Full balance matrix from DB
 * @returns Recommendation with reasoning
 */
export function recommendContent(
  brandId: number,
  balanceEntries: BalanceEntry[]
): BalanceRecommendation {
  if (!balanceEntries || balanceEntries.length === 0) {
    throw new Error('Balance matrix is empty - cannot recommend content')
  }

  // Group entries by variable_type
  const byType = balanceEntries.reduce((acc, entry) => {
    if (!acc[entry.variable_type]) {
      acc[entry.variable_type] = []
    }
    acc[entry.variable_type].push(entry)
    return acc
  }, {} as Record<string, BalanceEntry[]>)

  // Verify we have all required dimensions
  if (!byType['pillar'] || !byType['theme'] || !byType['mechanic']) {
    throw new Error('Balance matrix missing required dimensions (pillar, theme, mechanic)')
  }

  // Determine if we're in cold start or warm start mode
  const hasPerformanceData = balanceEntries.some(e => e.avg_performance !== null)
  const reasoning = hasPerformanceData ? 'performance_weighted' : 'cold_start_round_robin'

  // Select for each dimension
  const pillar = selectFromDimension(byType['pillar'], hasPerformanceData)
  const theme = selectFromDimension(byType['theme'], hasPerformanceData)
  const mechanic = selectFromDimension(byType['mechanic'], hasPerformanceData)

  return {
    pillar,
    theme,
    mechanic,
    reasoning
  }
}

/**
 * Selects a value from a dimension's entries.
 * Uses performance-weighted selection if performance data exists for this dimension,
 * otherwise falls back to round-robin.
 */
function selectFromDimension(entries: BalanceEntry[], globalHasPerformance: boolean): string {
  if (entries.length === 0) {
    throw new Error('No entries provided for dimension')
  }

  // Check if this specific dimension has performance data
  const entriesWithPerformance = entries.filter(e => e.avg_performance !== null)

  if (globalHasPerformance && entriesWithPerformance.length > 0) {
    // Warm start - performance-weighted selection
    return weightedSelection(entriesWithPerformance)
  } else {
    // Cold start or no performance data for this dimension - round-robin
    return roundRobinSelection(entries)
  }
}

/**
 * Round-robin selection: picks entry with lowest usage_count.
 * Ties broken alphabetically by variable_value.
 */
function roundRobinSelection(entries: BalanceEntry[]): string {
  const sorted = [...entries].sort((a, b) => {
    // First by usage_count ascending
    if (a.usage_count !== b.usage_count) {
      return a.usage_count - b.usage_count
    }
    // Then alphabetically by variable_value
    return a.variable_value.localeCompare(b.variable_value)
  })

  return sorted[0].variable_value
}

/**
 * Weighted random selection proportional to avg_performance.
 * Handles edge cases like zero or negative performance.
 */
function weightedSelection(entries: BalanceEntry[]): string {
  // Normalize weights - handle zero/negative performance
  const weights = entries.map(e => {
    const perf = e.avg_performance ?? 0
    // Ensure minimum weight of 1 so even zero-performance entries have a chance
    return Math.max(perf, 1)
  })

  const totalWeight = weights.reduce((sum, w) => sum + w, 0)

  // Generate random number between 0 and totalWeight
  let random = Math.random() * totalWeight

  // Select based on cumulative weight
  for (let i = 0; i < entries.length; i++) {
    random -= weights[i]
    if (random <= 0) {
      return entries[i].variable_value
    }
  }

  // Fallback (shouldn't happen, but handle floating point edge cases)
  return entries[entries.length - 1].variable_value
}
