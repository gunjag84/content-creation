import { useEffect, useState } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { BrandVoiceSection } from '../components/settings/BrandVoiceSection'
import { PersonaSection } from '../components/settings/PersonaSection'
import { ContentDefaultsSection } from '../components/settings/ContentDefaultsSection'
import { CompetitorAnalysisSection } from '../components/settings/CompetitorAnalysisSection'
import { ViralExpertiseSection } from '../components/settings/ViralExpertiseSection'
import { MasterPromptSection } from '../components/settings/MasterPromptSection'
import { PillarSlidersSection } from '../components/settings/PillarSlidersSection'
import { ThemeSection } from '../components/settings/ThemeSection'
import { MechanicsSection } from '../components/settings/MechanicsSection'
import { StoryToolsSection } from '../components/settings/StoryToolsSection'
import { BrandGuidanceSection } from '../components/settings/BrandGuidanceSection'
import { TemplateSection } from '../components/settings/TemplateSection'
import { SettingsHistorySection } from '../components/settings/SettingsHistorySection'
import { APIKeySection } from '../components/settings/APIKeySection'

interface SettingsProps {
  activeTab: string
}

export function Settings({ activeTab }: SettingsProps) {
  const { settings, loading, lastSaved, loadSettings, updateSection } = useSettingsStore()
  const [showSavedIndicator, setShowSavedIndicator] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    if (lastSaved) {
      setShowSavedIndicator(true)
      const timer = setTimeout(() => setShowSavedIndicator(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [lastSaved])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Loading settings...</div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-400">Failed to load settings</div>
      </div>
    )
  }

  const renderSection = () => {
    switch (activeTab) {
      case 'api-keys':
        return <APIKeySection />
      case 'brand-voice':
        return <BrandVoiceSection settings={settings} onUpdate={updateSection} />
      case 'target-persona':
        return <PersonaSection settings={settings} onUpdate={updateSection} />
      case 'content-pillars':
        return <PillarSlidersSection settings={settings} onUpdate={updateSection} />
      case 'themes':
        return <ThemeSection settings={settings} onUpdate={updateSection} />
      case 'mechanics':
        return <MechanicsSection settings={settings} onUpdate={updateSection} />
      case 'content-defaults':
        return <ContentDefaultsSection settings={settings} onUpdate={updateSection} />
      case 'brand-guidance':
        return <BrandGuidanceSection settings={settings} onUpdate={updateSection} />
      case 'competitor-analysis':
        return <CompetitorAnalysisSection settings={settings} onUpdate={updateSection} />
      case 'story-tools':
        return <StoryToolsSection settings={settings} onUpdate={updateSection} />
      case 'viral-expertise':
        return <ViralExpertiseSection settings={settings} onUpdate={updateSection} />
      case 'master-prompt':
        return <MasterPromptSection settings={settings} onUpdate={updateSection} />
      case 'templates':
        return <TemplateSection />
      case 'settings-history':
        return <SettingsHistorySection />
      default:
        return <BrandVoiceSection settings={settings} onUpdate={updateSection} />
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-100 mb-2">Settings</h1>
          <p className="text-slate-400">Configure your brand, content strategy, and generation defaults</p>
        </div>
        {showSavedIndicator && (
          <div className="text-green-400 text-sm">
            ✓ Saved
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-4">
        {renderSection()}
      </div>
    </div>
  )
}
