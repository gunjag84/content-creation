import { describe, it, expect } from 'vitest'

// Import only the pure function, not the React component
interface Pillars {
  generateDemand: number
  convertDemand: number
  nurtureLoyalty: number
}

function redistributePillars(
  current: Pillars,
  changedKey: keyof Pillars,
  newValue: number
): Pillars {
  // Clamp new value to valid range
  const clampedValue = Math.max(0, Math.min(100, newValue))
  const delta = clampedValue - current[changedKey]

  // Get other keys
  const otherKeys = (Object.keys(current) as (keyof Pillars)[]).filter(k => k !== changedKey)

  // Calculate total of other sliders
  const otherTotal = otherKeys.reduce((sum, key) => sum + current[key], 0)

  // Start with the new value for changed key
  const result: Pillars = { ...current, [changedKey]: clampedValue }

  // If all others are 0, we can't redistribute - need to add to one of them
  if (otherTotal === 0) {
    const remainder = 100 - clampedValue
    result[otherKeys[0]] = remainder
    result[otherKeys[1]] = 0
    return result
  }

  // Distribute delta proportionally across other sliders
  otherKeys.forEach(key => {
    const proportion = current[key] / otherTotal
    const newVal = current[key] - Math.round(delta * proportion)
    result[key] = Math.max(0, newVal) // Prevent negative values
  })

  // Ensure sum is exactly 100 (adjust for rounding errors)
  const sum = result.generateDemand + result.convertDemand + result.nurtureLoyalty
  if (sum !== 100) {
    // Adjust the first other key by the difference
    result[otherKeys[0]] += (100 - sum)
    // Prevent negative after adjustment
    if (result[otherKeys[0]] < 0) {
      result[otherKeys[0]] = 0
      result[otherKeys[1]] += (100 - sum)
    }
  }

  return result
}

describe('redistributePillars', () => {
  it('redistributes proportionally when one pillar increases', () => {
    const current = { generateDemand: 33, convertDemand: 33, nurtureLoyalty: 34 }
    const result = redistributePillars(current, 'generateDemand', 50)

    // generateDemand increased by 17, others should decrease proportionally
    expect(result.generateDemand).toBe(50)
    expect(result.convertDemand + result.nurtureLoyalty).toBe(50)
    expect(result.generateDemand + result.convertDemand + result.nurtureLoyalty).toBe(100)
  })

  it('ensures sum is exactly 100 after redistribution (rounding adjustment)', () => {
    const current = { generateDemand: 40, convertDemand: 30, nurtureLoyalty: 30 }
    const result = redistributePillars(current, 'convertDemand', 55)

    expect(result.generateDemand + result.convertDemand + result.nurtureLoyalty).toBe(100)
  })

  it('handles redistribution when one slider is at 0', () => {
    const current = { generateDemand: 50, convertDemand: 50, nurtureLoyalty: 0 }
    const result = redistributePillars(current, 'generateDemand', 70)

    expect(result.generateDemand).toBe(70)
    expect(result.nurtureLoyalty).toBe(0)
    expect(result.convertDemand).toBe(30)
    expect(result.generateDemand + result.convertDemand + result.nurtureLoyalty).toBe(100)
  })

  it('handles edge case when all other sliders are at 0', () => {
    const current = { generateDemand: 100, convertDemand: 0, nurtureLoyalty: 0 }
    const result = redistributePillars(current, 'generateDemand', 80)

    // When others are 0, they should absorb the difference
    expect(result.generateDemand).toBe(80)
    expect(result.generateDemand + result.convertDemand + result.nurtureLoyalty).toBe(100)
  })

  it('prevents negative values', () => {
    const current = { generateDemand: 10, convertDemand: 10, nurtureLoyalty: 80 }
    const result = redistributePillars(current, 'nurtureLoyalty', 100)

    expect(result.convertDemand).toBeGreaterThanOrEqual(0)
    expect(result.generateDemand).toBeGreaterThanOrEqual(0)
    expect(result.generateDemand + result.convertDemand + result.nurtureLoyalty).toBe(100)
  })
})
