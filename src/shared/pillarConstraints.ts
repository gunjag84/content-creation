import type { Settings } from './types'

export function getScenariosForPillar(settings: Settings, pillarName: string) {
  const pillar = settings.pillars.find(p => p.name === pillarName)
  return pillar?.scenarios ?? []
}

export function getMethodsForScenario(settings: Settings, pillarName: string, scenarioName: string) {
  const pillar = settings.pillars.find(p => p.name === pillarName)
  const scenario = pillar?.scenarios.find(s => s.name === scenarioName)
  if (!scenario || scenario.allowedMethods.length === 0) return settings.methods
  const allowed = new Set(scenario.allowedMethods)
  return settings.methods.filter(m => allowed.has(m.name))
}
