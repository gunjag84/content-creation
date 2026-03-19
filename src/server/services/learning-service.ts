import type { BalanceEntry, BalanceRecommendation, BalanceWarning, BalanceDashboardData } from '../../shared/types'

// --- Recommendation engine ---

const REQUIRED_DIMS = ['pillar', 'area', 'method', 'tonality'] as const

export function recommendContent(balanceEntries: BalanceEntry[]): BalanceRecommendation {
  if (!balanceEntries || balanceEntries.length === 0) {
    throw new Error('Balance matrix is empty - cannot recommend content')
  }

  const byType = balanceEntries.reduce((acc, entry) => {
    if (!acc[entry.variable_type]) acc[entry.variable_type] = []
    acc[entry.variable_type].push(entry)
    return acc
  }, {} as Record<string, BalanceEntry[]>)

  for (const dim of REQUIRED_DIMS) {
    if (!byType[dim]) {
      throw new Error(`Balance matrix missing required dimension: ${dim}`)
    }
  }

  const hasPerformanceData = balanceEntries.some(e => e.avg_performance !== null)
  const reasoning = hasPerformanceData ? 'performance_weighted' : 'cold_start_round_robin'

  return {
    pillar: selectFromDimension(byType['pillar'], hasPerformanceData),
    area: selectFromDimension(byType['area'], hasPerformanceData),
    approach: byType['approach'] ? selectFromDimension(byType['approach'], hasPerformanceData) : null,
    method: selectFromDimension(byType['method'], hasPerformanceData),
    tonality: selectFromDimension(byType['tonality'], hasPerformanceData),
    reasoning
  }
}

function selectFromDimension(entries: BalanceEntry[], globalHasPerformance: boolean): string {
  const withPerf = entries.filter(e => e.avg_performance !== null)
  if (globalHasPerformance && withPerf.length > 0) {
    return weightedSelection(withPerf)
  }
  return roundRobinSelection(entries)
}

function roundRobinSelection(entries: BalanceEntry[]): string {
  const sorted = [...entries].sort((a, b) => {
    if (a.usage_count !== b.usage_count) return a.usage_count - b.usage_count
    return a.variable_value.localeCompare(b.variable_value)
  })
  return sorted[0].variable_value
}

function weightedSelection(entries: BalanceEntry[]): string {
  const weights = entries.map(e => Math.max(e.avg_performance ?? 0, 1))
  const total = weights.reduce((s, w) => s + w, 0)
  let random = Math.random() * total
  for (let i = 0; i < entries.length; i++) {
    random -= weights[i]
    if (random <= 0) return entries[i].variable_value
  }
  return entries[entries.length - 1].variable_value
}

// --- Balance dashboard ---

export function calculateBalance(
  entries: BalanceEntry[],
  targetPercentages: Record<string, number>
): BalanceDashboardData {
  const pillarEntries = entries.filter(e => e.variable_type === 'pillar')
  const areaEntries = entries.filter(e => e.variable_type === 'area')
  const approachEntries = entries.filter(e => e.variable_type === 'approach')
  const methodEntries = entries.filter(e => e.variable_type === 'method')
  const tonalityEntries = entries.filter(e => e.variable_type === 'tonality')
  const totalCount = pillarEntries.reduce((s, e) => s + e.usage_count, 0)

  return {
    pillars: pillarEntries.map(e => ({
      name: e.variable_value,
      actual_pct: totalCount > 0 ? Math.round((e.usage_count / totalCount) * 100) : 0,
      target_pct: targetPercentages[e.variable_value] ?? 0,
      count: e.usage_count
    })),
    areas: areaEntries.map(e => ({
      name: e.variable_value,
      count: e.usage_count,
      avg_performance: e.avg_performance
    })),
    approaches: approachEntries.map(e => ({
      name: e.variable_value,
      count: e.usage_count,
      avg_performance: e.avg_performance
    })),
    methods: methodEntries.map(e => ({
      name: e.variable_value,
      count: e.usage_count,
      avg_performance: e.avg_performance
    })),
    tonalities: tonalityEntries.map(e => ({
      name: e.variable_value,
      count: e.usage_count,
      avg_performance: e.avg_performance
    })),
    total_posts: totalCount
  }
}

// --- Warnings ---

export function generateWarnings(entries: BalanceEntry[]): BalanceWarning[] {
  const warnings: BalanceWarning[] = []
  const now = Math.floor(Date.now() / 1000)

  for (const entry of entries) {
    if (entry.last_used === null || entry.usage_count <= 3) continue
    const days = Math.floor((now - entry.last_used) / 86400)
    if (days > 14) continue
    warnings.push({
      variable_type: entry.variable_type as BalanceWarning['variable_type'],
      variable_value: entry.variable_value,
      usage_count: entry.usage_count,
      days_span: days,
      message: `${entry.variable_value} used ${entry.usage_count}x in ${days} days - rotate?`
    })
  }

  return warnings
}
