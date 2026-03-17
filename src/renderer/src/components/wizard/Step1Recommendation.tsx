import { useState, useEffect } from 'react'
import { useCreatePostStore } from '../../stores/useCreatePostStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Switch } from '../ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select'
import { AlertCircle, Upload } from 'lucide-react'
import type { Settings } from '../../../../shared/types/settings'

export function Step1Recommendation() {
  const {
    mode,
    recommendation,
    warnings,
    selectedPillar,
    selectedTheme,
    selectedMechanic,
    contentType,
    impulse,
    customBackgroundPath,
    setMode,
    setRecommendation,
    setSelection,
    setStep,
    initManualSlides
  } = useCreatePostStore()

  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)

  // Load recommendation and settings on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [recData, settingsData] = await Promise.all([
          window.api.posts.getRecommendationData(1, {}),
          window.api.loadSettings()
        ])

        if (recData.data?.recommendation) {
          setRecommendation(recData.data.recommendation, recData.data.warnings || [])
        }
        setSettings(settingsData)
      } catch (error) {
        console.error('Failed to load recommendation data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [setRecommendation])

  const handleUploadBackground = async () => {
    try {
      const path = await window.api.templates.uploadBackground()
      if (path) {
        setSelection('customBackgroundPath', path)
      }
    } catch (error) {
      console.error('Failed to upload background:', error)
    }
  }

  const handleGenerate = () => {
    if (mode === 'ai') {
      setStep(2) // Go to generation step
    } else {
      // Manual mode - create empty slides and skip to edit
      initManualSlides(contentType)
      setStep(3)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-slate-400">Loading recommendations...</p>
      </div>
    )
  }

  const PILLAR_DISPLAY_NAMES: Record<string, string> = {
    generateDemand: 'Generate Demand',
    convertDemand: 'Convert Demand',
    nurtureLoyalty: 'Nurture Loyalty'
  }
  const pillars = settings?.contentPillars
    ? Object.keys(settings.contentPillars).map((k) => PILLAR_DISPLAY_NAMES[k] || k)
    : []
  const themes = settings?.themes?.oberthemen?.map((t) => t.name) || []
  const mechanics = settings?.mechanics?.mechanics?.map((m) => m.name) || []

  // Find warnings for each dimension
  const pillarWarning = warnings.find((w) => w.variable_type === 'pillar' && w.variable_value === selectedPillar)
  const themeWarning = warnings.find((w) => w.variable_type === 'theme' && w.variable_value === selectedTheme)
  const mechanicWarning = warnings.find((w) => w.variable_type === 'mechanic' && w.variable_value === selectedMechanic)

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Recommendation Card */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">
            {recommendation ? 'Content Recommendation' : 'Starting Fresh'}
          </CardTitle>
          <CardDescription className="text-slate-400">
            {recommendation
              ? `Based on ${recommendation.reasoning === 'cold_start_round_robin' ? 'equal rotation' : 'performance data'}`
              : 'No history yet - equal rotation active'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendation ? (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-slate-500">Pillar</div>
                <div className="font-medium text-slate-200">{recommendation.pillar}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Theme</div>
                <div className="font-medium text-slate-200">{recommendation.theme}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Mechanic</div>
                <div className="font-medium text-slate-200">{recommendation.mechanic}</div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              System will learn from your content performance over time.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Override Controls */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">Content Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dimension Selectors */}
          <div className="grid grid-cols-3 gap-4">
            {/* Pillar */}
            <div className="space-y-2">
              <Label className="text-slate-300">Pillar</Label>
              <div className="relative">
                <Select value={selectedPillar} onValueChange={(val) => setSelection('selectedPillar', val)}>
                  <SelectTrigger className="border-slate-600 bg-slate-900 text-slate-100">
                    <SelectValue placeholder="Select pillar" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-600 bg-slate-900">
                    {pillars.map((p) => (
                      <SelectItem key={p} value={p} className="text-slate-100">
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {pillarWarning && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-amber-400">
                    <AlertCircle size={12} />
                    <span>{pillarWarning.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Theme */}
            <div className="space-y-2">
              <Label className="text-slate-300">Theme</Label>
              <div className="relative">
                <Select value={selectedTheme} onValueChange={(val) => setSelection('selectedTheme', val)}>
                  <SelectTrigger className="border-slate-600 bg-slate-900 text-slate-100">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-600 bg-slate-900">
                    {themes.map((t) => (
                      <SelectItem key={t} value={t} className="text-slate-100">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {themeWarning && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-amber-400">
                    <AlertCircle size={12} />
                    <span>{themeWarning.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Mechanic */}
            <div className="space-y-2">
              <Label className="text-slate-300">Mechanic</Label>
              <div className="relative">
                <Select value={selectedMechanic} onValueChange={(val) => setSelection('selectedMechanic', val)}>
                  <SelectTrigger className="border-slate-600 bg-slate-900 text-slate-100">
                    <SelectValue placeholder="Select mechanic" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-600 bg-slate-900">
                    {mechanics.map((m) => (
                      <SelectItem key={m} value={m} className="text-slate-100">
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {mechanicWarning && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-amber-400">
                    <AlertCircle size={12} />
                    <span>{mechanicWarning.message}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Type */}
          <div className="space-y-2">
            <Label className="text-slate-300">Content Type</Label>
            <div className="flex gap-2">
              <Button
                variant={contentType === 'single' ? 'default' : 'outline'}
                onClick={() => setSelection('contentType', 'single')}
                className="flex-1"
              >
                Single Post
              </Button>
              <Button
                variant={contentType === 'carousel' ? 'default' : 'outline'}
                onClick={() => setSelection('contentType', 'carousel')}
                className="flex-1"
              >
                Carousel
              </Button>
            </div>
          </div>

          {/* Impulse */}
          <div className="space-y-2">
            <Label className="text-slate-300">Impulse (Optional)</Label>
            <Textarea
              value={impulse}
              onChange={(e) => setSelection('impulse', e.target.value)}
              placeholder="Guide AI with a specific angle or topic..."
              className="min-h-[100px] border-slate-600 bg-slate-900 text-slate-100 placeholder:text-slate-500"
            />
          </div>

          {/* Custom Background */}
          <div className="space-y-2">
            <Label className="text-slate-300">Custom Background (Optional)</Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleUploadBackground} className="gap-2">
                <Upload size={16} />
                Upload Image
              </Button>
              {customBackgroundPath && (
                <span className="text-xs text-slate-400">
                  {customBackgroundPath.split(/[\\/]/).pop()}
                </span>
              )}
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900 p-4">
            <div className="space-y-0.5">
              <Label className="text-slate-300">AI Generation</Label>
              <p className="text-sm text-slate-500">
                {mode === 'ai' ? 'AI will generate content' : 'Fill in content manually'}
              </p>
            </div>
            <Switch checked={mode === 'ai'} onCheckedChange={(checked) => setMode(checked ? 'ai' : 'manual')} />
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={!selectedPillar || !selectedTheme || !selectedMechanic}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {mode === 'ai' ? 'Generate Content' : 'Fill In Manually'}
        </Button>
      </div>
    </div>
  )
}
