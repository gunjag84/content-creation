import type { Settings } from '../../../../shared/types/settings'
import { Slider } from '@/components/ui/slider'

interface Pillars {
  generateDemand: number
  convertDemand: number
  nurtureLoyalty: number
}

/**
 * Redistributes pillar percentages proportionally when one value changes.
 * Always ensures the sum equals exactly 100%.
 */
export function redistributePillars(
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

interface PillarSlidersSectionProps {
  settings: Settings
  onUpdate: (section: 'contentPillars', value: Settings['contentPillars']) => Promise<void>
}

export function PillarSlidersSection({ settings, onUpdate }: PillarSlidersSectionProps) {
  const pillars = settings.contentPillars || { generateDemand: 50, convertDemand: 30, nurtureLoyalty: 20 }

  const handleSliderChange = (key: keyof Pillars, newValue: number) => {
    const updated = redistributePillars(pillars, key, newValue)
    onUpdate('contentPillars', updated)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Content Pillars</h2>
        <p className="text-slate-400 text-sm">
          Define the distribution of your content across three strategic pillars. The percentages must always sum to 100%.
        </p>
      </div>

      <div className="space-y-6">
        {/* Generate Demand Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-200">
              Generate Demand
              <span className="text-slate-400 ml-2 font-normal">(Nachfrage erzeugen)</span>
            </label>
            <span className="text-lg font-semibold text-slate-100">{pillars.generateDemand}%</span>
          </div>
          <Slider
            value={[pillars.generateDemand]}
            onValueChange={([v]) => handleSliderChange('generateDemand', v)}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Convert Demand Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-200">
              Convert Demand
              <span className="text-slate-400 ml-2 font-normal">(Nachfrage konvertieren)</span>
            </label>
            <span className="text-lg font-semibold text-slate-100">{pillars.convertDemand}%</span>
          </div>
          <Slider
            value={[pillars.convertDemand]}
            onValueChange={([v]) => handleSliderChange('convertDemand', v)}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Nurture Loyalty Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-200">
              Nurture Loyalty
              <span className="text-slate-400 ml-2 font-normal">(Loyalität pflegen)</span>
            </label>
            <span className="text-lg font-semibold text-slate-100">{pillars.nurtureLoyalty}%</span>
          </div>
          <Slider
            value={[pillars.nurtureLoyalty]}
            onValueChange={([v]) => handleSliderChange('nurtureLoyalty', v)}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      <div className="text-xs text-slate-500 mt-4">
        Adjusting one slider automatically redistributes the others proportionally to maintain 100% total.
      </div>
    </div>
  )
}
