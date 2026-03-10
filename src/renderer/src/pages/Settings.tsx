import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
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

export function Settings() {
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

      <Tabs defaultValue="brand-voice" orientation="vertical" className="flex-1 flex gap-6">
        <TabsList className="w-64 flex flex-col h-auto bg-slate-900 border border-slate-700 p-2 gap-1">
          <TabsTrigger value="brand-voice" className="w-full justify-start data-[state=active]:bg-slate-800">
            Brand Voice
          </TabsTrigger>
          <TabsTrigger value="target-persona" className="w-full justify-start data-[state=active]:bg-slate-800">
            Target Persona
          </TabsTrigger>
          <TabsTrigger value="content-pillars" className="w-full justify-start data-[state=active]:bg-slate-800">
            Content Pillars
          </TabsTrigger>
          <TabsTrigger value="themes" className="w-full justify-start data-[state=active]:bg-slate-800">
            Themes
          </TabsTrigger>
          <TabsTrigger value="mechanics" className="w-full justify-start data-[state=active]:bg-slate-800">
            Post Mechanics
          </TabsTrigger>
          <TabsTrigger value="content-defaults" className="w-full justify-start data-[state=active]:bg-slate-800">
            Content Defaults
          </TabsTrigger>
          <TabsTrigger value="brand-guidance" className="w-full justify-start data-[state=active]:bg-slate-800">
            Brand Guidance
          </TabsTrigger>
          <TabsTrigger value="competitor-analysis" className="w-full justify-start data-[state=active]:bg-slate-800">
            Competitor Analysis
          </TabsTrigger>
          <TabsTrigger value="story-tools" className="w-full justify-start data-[state=active]:bg-slate-800">
            Story Tools
          </TabsTrigger>
          <TabsTrigger value="viral-expertise" className="w-full justify-start data-[state=active]:bg-slate-800">
            Viral Expertise
          </TabsTrigger>
          <TabsTrigger value="master-prompt" className="w-full justify-start data-[state=active]:bg-slate-800">
            Master Prompt
          </TabsTrigger>
          <TabsTrigger value="templates" className="w-full justify-start data-[state=active]:bg-slate-800">
            Templates
          </TabsTrigger>
          <TabsTrigger value="settings-history" className="w-full justify-start data-[state=active]:bg-slate-800">
            Settings History
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto pr-4">
          <TabsContent value="brand-voice" className="mt-0">
            <BrandVoiceSection settings={settings} onUpdate={updateSection} />
          </TabsContent>

          <TabsContent value="target-persona" className="mt-0">
            <PersonaSection settings={settings} onUpdate={updateSection} />
          </TabsContent>

          <TabsContent value="content-pillars" className="mt-0">
            <PillarSlidersSection settings={settings} onUpdate={updateSection} />
          </TabsContent>

          <TabsContent value="themes" className="mt-0">
            <ThemeSection settings={settings} onUpdate={updateSection} />
          </TabsContent>

          <TabsContent value="mechanics" className="mt-0">
            <MechanicsSection settings={settings} onUpdate={updateSection} />
          </TabsContent>

          <TabsContent value="content-defaults" className="mt-0">
            <ContentDefaultsSection settings={settings} onUpdate={updateSection} />
          </TabsContent>

          <TabsContent value="brand-guidance" className="mt-0">
            <BrandGuidanceSection settings={settings} onUpdate={updateSection} />
          </TabsContent>

          <TabsContent value="competitor-analysis" className="mt-0">
            <CompetitorAnalysisSection settings={settings} onUpdate={updateSection} />
          </TabsContent>

          <TabsContent value="story-tools" className="mt-0">
            <StoryToolsSection settings={settings} onUpdate={updateSection} />
          </TabsContent>

          <TabsContent value="viral-expertise" className="mt-0">
            <ViralExpertiseSection settings={settings} onUpdate={updateSection} />
          </TabsContent>

          <TabsContent value="master-prompt" className="mt-0">
            <MasterPromptSection settings={settings} onUpdate={updateSection} />
          </TabsContent>

          <TabsContent value="templates" className="mt-0">
            <TemplateSection />
          </TabsContent>

          <TabsContent value="settings-history" className="mt-0">
            <SettingsHistorySection />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
