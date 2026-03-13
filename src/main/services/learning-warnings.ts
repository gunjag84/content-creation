import type { BalanceEntry } from '../db/queries'
import type { BalanceWarning } from '../../shared/types/generation'

/**
 * Generate soft-signal warnings for overused variables.
 * Triggers when usage_count > 3 AND last_used within 14 days.
 */
export function generateWarnings(entries: BalanceEntry[]): BalanceWarning[] {
  const warnings: BalanceWarning[] = []
  const now = Math.floor(Date.now() / 1000)
  const fourteenDaysInSeconds = 14 * 24 * 60 * 60

  for (const entry of entries) {
    // Skip if no last_used timestamp
    if (entry.last_used === null) {
      continue
    }

    // Skip if usage_count <= 3
    if (entry.usage_count <= 3) {
      continue
    }

    // Calculate days since last use
    const daysSinceLastUse = Math.floor((now - entry.last_used) / (24 * 60 * 60))

    // Skip if last_used is older than 14 days
    if (daysSinceLastUse > 14) {
      continue
    }

    // Generate warning
    warnings.push({
      variable_type: entry.variable_type as 'pillar' | 'mechanic' | 'theme',
      variable_value: entry.variable_value,
      usage_count: entry.usage_count,
      days_span: daysSinceLastUse,
      message: `${entry.variable_value} used ${entry.usage_count}x in ${daysSinceLastUse} days - rotate?`
    })
  }

  return warnings
}
