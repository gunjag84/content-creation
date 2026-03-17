import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import type { BalanceDashboardData, BalanceWarning } from '../../../shared/types/generation'

interface BalanceWidgetProps {
  onNavigate: (page: 'create' | 'dashboard') => void
}

export function BalanceWidget({ onNavigate }: BalanceWidgetProps) {
  const [dashboardData, setDashboardData] = useState<BalanceDashboardData | null>(null)
  const [warnings, setWarnings] = useState<BalanceWarning[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [alertsOpen, setAlertsOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (warnings.length > 0) setAlertsOpen(true)
  }, [warnings])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await window.api.posts.getRecommendationData(1, {})
      setDashboardData(result.data?.dashboardData ?? null)
      setWarnings(result.data?.warnings ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load balance data')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-lg font-semibold mb-4 text-slate-100">Balance Overview</h2>
        <p className="text-slate-400 text-sm">Loading...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-lg font-semibold mb-4 text-slate-100">Balance Overview</h2>
        <p className="text-red-400 text-sm">{error}</p>
      </Card>
    )
  }

  // Cold start state
  if (!dashboardData || dashboardData.total_posts === 0) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-lg font-semibold mb-4 text-slate-100">Balance Overview</h2>
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">
            No posts yet - create your first post to see balance insights.
          </p>
          <Button
            onClick={() => onNavigate('create')}
            className="w-full"
          >
            Start Creating
          </Button>
        </div>
      </Card>
    )
  }

  // Warm state - show data
  const mechanicsMax = Math.max(...dashboardData.mechanics.map((m) => m.count), 1)
  const themesMax = Math.max(...dashboardData.themes.map((t) => t.count), 1)
  const warningSet = new Set(warnings.map((w) => w.variable_value))

  return (
    <Card className="border-slate-700 bg-slate-800/50 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Balance Overview</h2>
        <span className="text-xs text-slate-500">{dashboardData.total_posts} posts total</span>
      </div>

      {/* Section 1: Content Pillars - actual vs target */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-300">Content Pillars</h3>
          <div className="flex items-center gap-3 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-1.5 rounded-full bg-blue-500" /> actual
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-1.5 rounded-full border border-dashed border-blue-400/60" /> target
            </span>
          </div>
        </div>
        <div className="space-y-3">
          {dashboardData.pillars.map((pillar) => {
            const deviation = Math.abs(pillar.actual_pct - pillar.target_pct)
            const offTarget = deviation > 15
            return (
              <div key={pillar.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={offTarget ? 'text-amber-400' : 'text-slate-400'}>
                    {pillar.name}
                    {offTarget && ' - off target'}
                  </span>
                  <span className="text-slate-500">
                    {pillar.actual_pct.toFixed(0)}% of {pillar.target_pct}%
                  </span>
                </div>
                {/* Single combined bar: actual fill + target marker */}
                <div className="relative h-2 w-full bg-slate-700 rounded-full">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full ${offTarget ? 'bg-amber-500/80' : 'bg-blue-500'}`}
                    style={{ width: `${pillar.actual_pct}%` }}
                  />
                  {/* Target marker line */}
                  <div
                    className="absolute inset-y-0 w-0.5 bg-blue-400/60"
                    style={{ left: `${pillar.target_pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Section 2: Mechanics - usage frequency */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-300">Mechanics</h3>
        <div className="space-y-2">
          {dashboardData.mechanics
            .sort((a, b) => b.count - a.count)
            .map((mechanic) => {
              const hasWarning = warningSet.has(mechanic.name)
              return (
                <div key={mechanic.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={hasWarning ? 'text-amber-400' : 'text-slate-400'}>
                      {mechanic.name}
                      {hasWarning && ' - overused'}
                    </span>
                    <span className="text-slate-500">
                      {mechanic.count}x used
                    </span>
                  </div>
                  <div className="relative h-2 w-full bg-slate-700 rounded-full">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full ${hasWarning ? 'bg-amber-500/80' : 'bg-slate-500'}`}
                      style={{ width: `${(mechanic.count / mechanicsMax) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {/* Section 3: Themes - usage frequency */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-slate-300">Themes</h3>
          {dashboardData.themes.length > 8 && (
            <span className="text-xs text-slate-500">(top 8)</span>
          )}
        </div>
        <div className="space-y-2">
          {dashboardData.themes
            .sort((a, b) => b.count - a.count)
            .slice(0, 8)
            .map((theme) => {
              const hasWarning = warningSet.has(theme.name)
              return (
                <div key={theme.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={hasWarning ? 'text-amber-400' : 'text-slate-400'}>
                      {theme.name}
                      {hasWarning && ' - overused'}
                    </span>
                    <span className="text-slate-500">
                      {theme.count}x used
                    </span>
                  </div>
                  <div className="relative h-2 w-full bg-slate-700 rounded-full">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full ${hasWarning ? 'bg-amber-500/80' : 'bg-slate-500'}`}
                      style={{ width: `${(theme.count / themesMax) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {/* Section 4: Rotation Alerts */}
      {warnings.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-slate-700">
          <button
            onClick={() => setAlertsOpen(!alertsOpen)}
            className="flex items-center gap-2 text-sm font-medium text-amber-400 hover:text-amber-300"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Rotation Alerts ({warnings.length})</span>
            <span className="text-xs text-slate-500 ml-auto">
              {alertsOpen ? 'Hide' : 'Show'}
            </span>
          </button>
          {alertsOpen && (
            <div className="space-y-2">
              {warnings.map((warning, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <AlertTriangle className="w-3 h-3 mt-0.5 text-amber-500 flex-shrink-0" />
                  <span>{warning.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
