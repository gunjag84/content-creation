import type { Settings } from './types'

export function getAnglesForPillar(settings: Settings, pillarName: string) {
  const pillar = settings.pillars.find(p => p.name === pillarName)
  return pillar?.angles ?? []
}

export function getFilteredMethods(settings: Settings, pillarName: string) {
  const pillar = settings.pillars.find(p => p.name === pillarName)
  if (!pillar || pillar.allowedMethods.length === 0) return settings.methods
  const allowed = new Set(pillar.allowedMethods)
  return settings.methods.filter(m => allowed.has(m.name))
}

export function getFilteredTonalities(settings: Settings, pillarName: string) {
  const pillar = settings.pillars.find(p => p.name === pillarName)
  if (!pillar || pillar.allowedTonalities.length === 0) return settings.tonalities
  const allowed = new Set(pillar.allowedTonalities)
  return settings.tonalities.filter(t => allowed.has(t.name))
}

export function getFilteredAreas(settings: Settings, pillarName: string) {
  const pillar = settings.pillars.find(p => p.name === pillarName)
  if (!pillar || !pillar.allowedAreas || pillar.allowedAreas.length === 0) return settings.areas
  const allowed = new Set(pillar.allowedAreas)
  return settings.areas.filter(a => allowed.has(a.name))
}

export function isAreaRequired(settings: Settings, pillarName: string): boolean {
  const pillar = settings.pillars.find(p => p.name === pillarName)
  return pillar?.areaRequired ?? true
}
