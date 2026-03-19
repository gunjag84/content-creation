import type { ZoneOverride } from './types'

export const ZONE_POSITION_DEFAULTS = {
  hook: { top: 0,   height: 280 },
  body: { top: 280, height: 640 },
  cta:  { top: 920, height: 190 },
} as const

export const AVAILABLE_HEIGHT = 1110

export type ZoneId = 'hook' | 'body' | 'cta'

export interface ZoneLayout {
  top: number
  height: number
}

/**
 * Compute dynamic zone positions. Present zones proportionally share the
 * available 1110px text area. Zones with manual position overrides (both
 * posTop and posHeight set) keep their overridden values.
 */
export function computeZoneLayout(
  presentZones: ZoneId[],
  overrides: Record<string, ZoneOverride>,
  availableHeight: number = AVAILABLE_HEIGHT,
): Record<string, ZoneLayout> {
  const result: Record<string, ZoneLayout> = {}

  // Separate zones into manually positioned vs auto-layout
  const autoZones: ZoneId[] = []
  let usedHeight = 0

  for (const zoneId of presentZones) {
    const ov = overrides[zoneId]
    if (ov?.posTop !== undefined && ov?.posHeight !== undefined) {
      // Manual override - use as-is
      result[zoneId] = { top: ov.posTop, height: ov.posHeight }
      usedHeight += ov.posHeight
    } else {
      autoZones.push(zoneId)
    }
  }

  if (autoZones.length === 0) return result

  // Remaining height for auto zones
  const remainingHeight = availableHeight - usedHeight

  // Sum of default heights for auto zones
  const totalDefault = autoZones.reduce(
    (sum, z) => sum + ZONE_POSITION_DEFAULTS[z].height, 0
  )

  // Distribute proportionally, keep zone order (hook, body, cta)
  // Sort auto zones by their natural order
  const orderedAuto = autoZones.sort(
    (a, b) => ZONE_POSITION_DEFAULTS[a].top - ZONE_POSITION_DEFAULTS[b].top
  )

  // Compute heights first (proportional)
  const heights: Record<string, number> = {}
  let allocated = 0
  orderedAuto.forEach((z, i) => {
    if (i === orderedAuto.length - 1) {
      // Last zone gets remainder to avoid rounding gaps
      heights[z] = remainingHeight - allocated
    } else {
      const h = Math.round(
        (ZONE_POSITION_DEFAULTS[z].height / totalDefault) * remainingHeight
      )
      heights[z] = h
      allocated += h
    }
  })

  // Compute tops: auto zones fill gaps between manually positioned zones
  // Build a sorted list of all zones in order to assign tops
  const allOrdered = [...presentZones].sort(
    (a, b) => ZONE_POSITION_DEFAULTS[a].top - ZONE_POSITION_DEFAULTS[b].top
  )

  let currentTop = 0
  for (const z of allOrdered) {
    if (result[z]) {
      // Manually positioned - skip but advance cursor past it
      // (manual zones don't participate in stacking)
      continue
    }
    result[z] = { top: currentTop, height: heights[z] }
    currentTop += heights[z]
  }

  return result
}
