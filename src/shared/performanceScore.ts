/**
 * Weighted performance score formula.
 * Used in both server (DB upsert) and client (display).
 */
export function computePerformanceScore(data: {
  reach?: number | null
  likes?: number | null
  comments?: number | null
  shares?: number | null
  saves?: number | null
}): number {
  const reach = data.reach ?? 0
  const likes = data.likes ?? 0
  const comments = data.comments ?? 0
  const shares = data.shares ?? 0
  const saves = data.saves ?? 0

  if (reach === 0 && likes === 0 && comments === 0 && shares === 0 && saves === 0) {
    return 0
  }

  return reach + likes * 2 + comments * 3 + shares * 4 + saves * 3
}
